import { createClient } from "redis";
import { PrismaClient, Status } from "./generated/prisma/client";
import type { Job } from "./utils/Types";
import { processVideoJob } from "./utils/FFmpeg";
import { deleteVideoAssets } from "./utils/S3Client";

const JOB_QUEUE = "kinesis";
const CLEANUP_QUEUE = "kinesis:cleanup";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CLEANUP_DELAY_MS = 60 * 60 * 1000;
const CLEANUP_POLL_MS = 30 * 1000;
const CLEANUP_BATCH_SIZE = 10;

let isStartingUp = true;

function formatRedisConnectError(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;

    if (err && typeof err === "object") {
        const redisErr = err as {
            syscall?: string;
            code?: string;
            address?: string;
            port?: number;
        };

        const address = redisErr.address
            ? redisErr.port
                ? `${redisErr.address}:${redisErr.port}`
                : redisErr.address
            : "";

        return [redisErr.syscall, redisErr.code, address].filter(Boolean).join(" ") || "unknown error";
    }

    return String(err);
}

const client = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: () => false,
    },
});

client.on("error", (err) => {
    if (!isStartingUp) {
        console.error("Redis client error:", err instanceof Error ? err.message : err);
    }
});
client.on("connect", () => console.log("Redis Client Connected"));
client.on("end", () => console.log("Redis Client Disconnected"));

try {
    await client.connect();
    isStartingUp = false;
} catch (err) {
    const message = formatRedisConnectError(err);
    console.error(`Worker startup failed: could not connect to Redis at ${REDIS_URL} (${message})`);
    process.exit(1);
}

const db = new PrismaClient();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleCleanup(videoId: string) {
    await client.zAdd(CLEANUP_QUEUE, [{
        score: Date.now() + CLEANUP_DELAY_MS,
        value: videoId,
    }]);
    console.log(`Scheduled cleanup for video ${videoId} in 1 hour`);
}

async function processDueCleanupJobs() {
    const dueVideoIds = await client.zRangeByScore(
        CLEANUP_QUEUE,
        0,
        Date.now(),
        {
            LIMIT: {
                offset: 0,
                count: CLEANUP_BATCH_SIZE,
            },
        }
    );

    if (dueVideoIds.length === 0) return;

    for (const videoId of dueVideoIds) {
        try {
            const video = await db.videos.findUnique({
                where: { videoId },
                select: { s3InputKey: true },
            });

            await deleteVideoAssets(videoId, video?.s3InputKey);
            await client.zRem(CLEANUP_QUEUE, videoId);
            console.log(`Deleted S3 assets for video ${videoId}`);
        } catch (err) {
            console.error(`Cleanup failed for video ${videoId}:`, err);
        }
    }
}

let running = true;
process.on("SIGINT", async () => {
    console.log("\nShutting down worker...");
    running = false;
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }

    if (client.isOpen) {
        await client.quit();
    }

    await db.$disconnect();
    process.exit(0);
});

async function pollQueue() {
    while (running) {
        try {
            const res = await client.blPop(JOB_QUEUE, 5); // wait up to 5s for a job
            if (!res) {
                // no job within 5s sleep for 10s
                await sleep(10000);
                continue;
            }

            const { element: videoId } = res;
            try {
                const value: Job | null = await db.videos.findUnique({
                    where: {
                        videoId
                    }
                })

                if (!value) throw new Error("invalid video id, not found in db");

                await db.videos.update({
                    where: {
                        videoId
                    },
                    data: {
                        status: Status.PROCESSING
                    }
                })

                console.log(value);
                await processVideoJob(value);
                await db.videos.update({
                    where: {
                        videoId
                    },
                    data: {
                        status: Status.COMPLETED
                    }
                })
                await scheduleCleanup(videoId);
            } catch (err) {
                if (err instanceof Error && err.message.includes("error while transcoding")) {
                    console.log("Error while processing job", err);
                    await client.rPush(JOB_QUEUE, videoId);
                } else {
                    console.log("Error", err);
                }

                await db.videos.update({
                    where: {
                        videoId
                    },
                    data: {
                        status: Status.FAILED
                    }
                })
            }
        } catch (err) {
            console.error("Error in worker loop:", err);
            await sleep(3000);
        }
    }
}

cleanupTimer = setInterval(() => {
    if (!running) return;

    processDueCleanupJobs().catch((err) => {
        console.error("Cleanup loop error:", err);
    });
}, CLEANUP_POLL_MS);

await processDueCleanupJobs();

console.log("Worker started");
pollQueue();
