import { createClient } from "redis";
import type { Upload } from "../db/types";

export const client = await createClient({
	username: Bun.env.REDIS_USERNAME,
	password: Bun.env.REDIS_PASSWORD,
	socket: {
		host: "redis-13667.c311.eu-central-1-1.ec2.redns.redis-cloud.com",
		port: 13667,
	},
})
	.on("error", (err) => console.log("Redis Client Error", err))
	.connect();

export async function checkSharableLinkExists(shareableLink: string) {
	return !!(await client.exists(shareableLink));
}

export async function cacheUploadData(
	shareableLink: string,
	uploadData: Upload,
): Promise<void> {
	await client.set(shareableLink, JSON.stringify(uploadData), {
		expiration: { type: "EX", value: getTtlSeconds(uploadData.ttl) },
	});
}

export async function getCachedUploadData(
	shareableLink: string,
): Promise<Upload | null> {
	const res = await client.get(shareableLink);
	if (!res) return null;
	return JSON.parse(res) as Upload;
}

function getTtlSeconds(ttl: Date) {
	const now = Date.now();
	const ttlMs = ttl.getTime();
	return Math.floor(Math.max(0, ttlMs - now) / 1000);
}
