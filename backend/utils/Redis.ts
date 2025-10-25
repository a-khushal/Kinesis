import { createClient, type RedisClientType } from "redis";
import { QUEUE_NAME } from "./Constant";

export class RedisManager {
    private static instance: RedisManager;
    private client: RedisClientType;

    private constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
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
        await this.client.rPush(QUEUE_NAME, videoId);
        return true;
    }
}