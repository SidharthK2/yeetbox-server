import { createMiddleware } from "hono/factory";
import { client as redis } from "../integrations/redis";

interface GlobalRateLimitOptions {
	windowMs: number;
	maxRequests: number;
	keyName: string;
}

export const globalRateLimitMiddleware = (options: GlobalRateLimitOptions) => {
	return createMiddleware(async (c, next) => {
		const now = Date.now();
		const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
		const windowKey = `global_${options.keyName}:${windowStart}`;

		try {
			console.log(`🔍 Rate limit check - Key: ${windowKey}`);

			const currentRequests = await redis.incr(windowKey);
			console.log(
				`📊 Redis INCR result: ${currentRequests} (type: ${typeof currentRequests})`,
			);

			await redis.expire(windowKey, Math.ceil(options.windowMs / 1000));
			console.log("⏰ Set expiration");

			if (typeof currentRequests !== "number" || currentRequests <= 0) {
				console.warn(`❌ Invalid Redis INCR result: ${currentRequests}`);
				// Fail open - allow request
				await next();
				return;
			}

			console.log(`✅ Valid count: ${currentRequests}/${options.maxRequests}`);

			// Check limit
			if (currentRequests > options.maxRequests) {
				const resetTime = windowStart + options.windowMs;

				c.header("X-Global-RateLimit-Limit", options.maxRequests.toString());
				c.header("X-Global-RateLimit-Remaining", "0");
				c.header(
					"X-Global-RateLimit-Reset",
					Math.ceil(resetTime / 1000).toString(),
				);

				console.log(
					`🚨 Rate limit exceeded: ${currentRequests}/${options.maxRequests}`,
				);

				return c.json(
					{
						error: "You are being rate limited!",
						retryAfter: Math.ceil((resetTime - now) / 1000),
					},
					429,
				);
			}

			// Success - add headers and continue
			const remaining = Math.max(0, options.maxRequests - currentRequests);
			c.header("X-Global-RateLimit-Limit", options.maxRequests.toString());
			c.header("X-Global-RateLimit-Remaining", remaining.toString());
			c.header(
				"X-Global-RateLimit-Reset",
				Math.ceil((windowStart + options.windowMs) / 1000).toString(),
			);

			console.log(
				`✅ Request allowed: ${currentRequests}/${options.maxRequests}, remaining: ${remaining}`,
			);

			await next();
		} catch (error) {
			console.error("💥 Rate limit check failed:", error);
			// Fail open
			await next();
		}
	});
};

export const globalUploadLimit = globalRateLimitMiddleware({
	windowMs: 60 * 1000,
	maxRequests: 50,
	keyName: "uploads",
});

export const globalDownloadLimit = globalRateLimitMiddleware({
	windowMs: 60 * 1000,
	maxRequests: 500,
	keyName: "downloads",
});

export const globalGeneralLimit = globalRateLimitMiddleware({
	windowMs: 60 * 1000,
	maxRequests: 10,
	keyName: "general",
});
