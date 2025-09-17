import { Hono } from "hono";
import {
	findOrCreateUser,
	generateUniqueShareableLink,
} from "../services/user-service";
import { setCookie } from "hono/cookie";
import { putObject, BUCKET_URL, getObject } from "../integrations/s3";
import {
	createUpload,
	findUploadByShareableLink,
} from "../repository/upload-repository";
import {cacheUploadData, getCachedUploadData} from "../integrations/redis.ts";
import {globalDownloadLimit, globalUploadLimit} from "../middleware/ratelimit.ts"

type Variables = {
	bearer_token: string;
};

export const file = new Hono<{ Variables: Variables }>();

file.post("/upload", globalUploadLimit,  async (c) => {
	try {
		const token = c.get("bearer_token");
		const {id: userId, bearer_token } = await findOrCreateUser(token);
		setCookie(c, "bearer_token", bearer_token, { httpOnly: true });
		const body = await c.req.parseBody();
		const file = body.file

        if (!file || !(file instanceof File)) {
            return c.json({ error: "Valid file required" }, 400);
        }
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        const ALLOWED_TYPES = ['image/', 'application/pdf', 'text/', 'video/'];

        if (file.size > MAX_SIZE) {
            return c.json({ error: "File too large" }, 413);
        }

        if (!ALLOWED_TYPES.some(type => file.type.startsWith(type))) {
            return c.json({ error: "File type not allowed" }, 415);
        }
		const id = crypto.randomUUID();
		const putObjPromise = putObject(file);
		const shareableLinkPromise = generateUniqueShareableLink (id);
        const [{s3Key}, shareableLink] = await Promise.all([putObjPromise,shareableLinkPromise])
		const s3Url = `${BUCKET_URL}${s3Key}`;
        const uploadPayload = {
            id,
            shareable_link: shareableLink,
            s3_link: s3Url,
            ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            uploader: userId,
        }
        //Database + Cache in transaction pattern
        const [uploadRecord] = await Promise.all([
            createUpload(uploadPayload),
            cacheUploadData(shareableLink, uploadPayload)
        ]);

        setCookie(c, "bearer_token", bearer_token, {
            httpOnly: true,
            secure: true, // HTTPS only
            sameSite: 'strict'
        });
		return c.json({
			success: true,
			shareableLink: uploadRecord.shareable_link,
			expiresAt: uploadRecord.ttl,
		});
	} catch (err) {
        console.error('Upload failed:', {
            error: err,
            timestamp: new Date().toISOString(),
        });
        return c.json({
            error: "Upload failed",
        }, 500);
    }
});

file.get("/:link", globalDownloadLimit, async (c) => {
	try {
		const shareLink = c.req.param("link");
        const cachedUpload = await getCachedUploadData(shareLink);
        if (cachedUpload) {
            console.log("🚀 Cache HIT for:", shareLink);
            const res = await getObject(cachedUpload.s3_link);
            if (!res.Body) {
                return c.json({ message: "File not found" }, 404);
            }
            c.header("Content-Type", res.ContentType || "application/octet-stream");
            c.header("Content-Disposition", "attachment");
            const stream = res.Body as ReadableStream;
            return c.body(stream);
        }
        console.log("💾 Cache MISS, querying DB for:", shareLink);
        const upload = await findUploadByShareableLink(shareLink);
		if (!upload) return c.json({ message: "Could not find upload" }, 404);
        await cacheUploadData(shareLink, upload);
		const res = await getObject(upload.s3_link);
		if (!res.Body) {
			return c.json({ message: "File not found" }, 404);
		}
		c.header("Content-Type", res.ContentType || "application/octet-stream");
		c.header("Content-Disposition", "attachment");
		const stream = res.Body as ReadableStream;
		return c.body(stream);
	} catch (err) {
		console.error(err);
		return c.json({ message: err instanceof Error ? err.message : err }, 500);
	}
});
