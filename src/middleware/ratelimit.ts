// src/middleware/globalRateLimit.ts - SAFER VERSION
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
            // Execute pipeline
            const pipeline = redis.multi();
            pipeline.incr(windowKey);
            pipeline.expire(windowKey, Math.ceil(options.windowMs / 1000));

            const results = await pipeline.exec();

            // Safe extraction with multiple fallbacks
            let currentRequests = 1; // Default to 1 if we can't determine count

            if (Array.isArray(results) && results.length > 0) {
                const incrResult = results[0];

                // Redis pipeline results are typically [error, result] tuples
                if (Array.isArray(incrResult) && incrResult.length >= 2) {
                    const [error, value] = incrResult;

                    if (!error && typeof value === 'number') {
                        currentRequests = value;
                    } else if (!error && typeof value === 'string') {
                        // Sometimes Redis returns string numbers
                        const parsed = parseInt(value, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                            currentRequests = parsed;
                        }
                    } else if (error) {
                        console.error('Redis INCR error:', error);
                        // Fall through to fail-open behavior
                    }
                } else {
                    console.warn('Unexpected Redis pipeline result format:', incrResult);
                }
            } else {
                console.warn('No results from Redis pipeline');
            }

            // Check if global limit exceeded
            if (currentRequests > options.maxRequests) {
                const resetTime = windowStart + options.windowMs;

                c.header('X-Global-RateLimit-Limit', options.maxRequests.toString());
                c.header('X-Global-RateLimit-Remaining', '0');
                c.header('X-Global-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

                return c.json({
                    error: "Server temporarily overloaded. Please try again later.",
                    retryAfter: Math.ceil((resetTime - now) / 1000)
                }, 503);
            }

            // Add rate limit info to headers
            const remaining = Math.max(0, options.maxRequests - currentRequests);
            c.header('X-Global-RateLimit-Limit', options.maxRequests.toString());
            c.header('X-Global-RateLimit-Remaining', remaining.toString());
            c.header('X-Global-RateLimit-Reset', Math.ceil((windowStart + options.windowMs) / 1000).toString());

            await next();

        } catch (error) {
            console.error('Global rate limit check failed:', error);
            // Fail open - allow request if Redis operations fail
            // This ensures your app stays available even if Redis has issues
            await next();
        }
    });
};

export const globalUploadLimit = globalRateLimitMiddleware({
    windowMs: 60 * 1000,    // 1-minute window
    maxRequests: 50,        // 50 uploads/minute globally (adjust based on your S3 bandwidth)
    keyName: 'uploads'
});

export const globalDownloadLimit = globalRateLimitMiddleware({
    windowMs: 60 * 1000,    // 1-minute window
    maxRequests: 500,       // 500 downloads/minute globally
    keyName: 'downloads'
});

export const globalGeneralLimit = globalRateLimitMiddleware({
    windowMs: 60 * 1000,    // 1-minute window
    maxRequests: 1000,      // 1000 requests/minute globally
    keyName: 'general'
});