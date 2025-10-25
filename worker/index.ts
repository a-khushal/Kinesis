import { createClient } from "redis";
import { PrismaClient } from "./generated/prisma/client";
import type { Job } from "./utils/Types";
import { processVideoJob } from "./utils/FFmpeg";

const JOB_QUEUE = "kinesis";

const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.error("Redis Client Error:", err));
client.on("connect", () => console.log("Redis Client Connected"));
client.on("end", () => console.log("Redis Client Disconnected"));

await client.connect();
const db = new PrismaClient();

let running = true;
process.on("SIGINT", async () => {
    console.log("\nShutting down worker...");
    running = false;
    await client.quit();
    process.exit(0);
});

async function pollQueue() {
    while (running) {
        try {
            const res = await client.blPop(JOB_QUEUE, 5); // wait up to 5s for a job
            if (!res) {
                // no job within 5s sleep for 10s
                await new Promise((r) => setTimeout(r, 10000));
                continue;
            }

            const { element: videoId } = res;
            try {
                const value: Job | null = await db.videos.findUnique({
                    where: {
                        videoId
                    }
                })
                console.log(value);
                if (!value) throw new Error("invalid video id, not found in db");
                await processVideoJob(value);
            } catch (err) {
                if (err instanceof Error && err.message.includes("error while transcoding")) {
                    console.log("Error while processing job", err);
                    client.rPush(JOB_QUEUE, videoId);
                } else {
                    console.log("Error", err);
                }
            }
        } catch (err) {
            console.error("Error in worker loop:", err);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
}

console.log("Worker started");
pollQueue();
