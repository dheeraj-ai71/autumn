import "dotenv/config";
import { Redis } from "@upstash/redis";
import { Redis as IORedis } from "ioredis";

// Create a wrapper that provides the same interface as Upstash Redis
class LocalRedisWrapper {
	private client: IORedis;

	constructor(client: IORedis) {
		this.client = client;
	}

	async get<T = string>(key: string): Promise<T | null> {
		const result = await this.client.get(key);
		if (!result) return null;
		
		try {
			return JSON.parse(result) as T;
		} catch {
			return result as T;
		}
	}

	async set(key: string, value: any, options?: { ex?: number }): Promise<string> {
		const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
		
		if (options?.ex) {
			await this.client.setex(key, options.ex, stringValue);
		} else {
			await this.client.set(key, stringValue);
		}
		
		return "OK";
	}

	async del(key: string): Promise<number> {
		return await this.client.del(key);
	}

	async keys(pattern: string): Promise<string[]> {
		return await this.client.keys(pattern);
	}
}

export const initUpstash = async () => {
	// Try Upstash first
	if (process.env.UPSTASH_TOKEN && process.env.UPSTASH_URL) {
		return new Redis({
			url: process.env.UPSTASH_URL,
			token: process.env.UPSTASH_TOKEN,
		});
	}

	// Fall back to local Redis
	const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
	console.log("Upstash not configured, using local Redis:", redisUrl);
	
	const localRedis = new IORedis(redisUrl, {
		retryStrategy: () => 5000,
	});

	// Test the connection
	try {
		await localRedis.ping();
		return new LocalRedisWrapper(localRedis);
	} catch (error) {
		console.error("Failed to connect to local Redis:", error);
		return null;
	}
};