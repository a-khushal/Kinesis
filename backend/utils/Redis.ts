import { createClient, type RedisClientType } from "redis";
import { JOB_QUEUE } from "./Constant";

export class RedisManager {
    private static instance: RedisManager;
    private client: RedisClientType;

    private constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || "redis://redis:6379",
        });

        this.client.on('error', (err) => console.error('Redis Client Error:', err));
    }

    public static getInstance(): RedisManager {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public async connect(): Promise<void> {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    public async disconnect(): Promise<void> {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }

    public async addJob(videoId: string): Promise<boolean> {
        await this.client.rPush(JOB_QUEUE, videoId);
        return true;
    }
}
