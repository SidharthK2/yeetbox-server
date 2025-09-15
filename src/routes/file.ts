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

type Variables = {
	bearer_token: string;
};

export const file = new Hono<{ Variables: Variables }>();

file.post("/upload", async (c) => {
	try {
		const token = c.get("bearer_token");
		const {id: userId, bearer_token } = await findOrCreateUser(token);
		setCookie(c, "bearer_token", bearer_token, { httpOnly: true });
		const body = await c.req.parseBody();
		const file = body.file as File;
		const id = crypto.randomUUID();
		const { s3Key } = await putObject(file);
		const s3Url = `${BUCKET_URL}${s3Key}`;
		const shareableLink = await generateUniqueShareableLink (id);
        const uploadPayload = {
            id,
            shareable_link: shareableLink,
            s3_link: s3Url,
            ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            uploader: userId,
        }
		const uploadRecord = await createUpload(uploadPayload);
        await cacheUploadData(shareableLink ,uploadPayload)
		return c.json({
			success: true,
			shareableLink: uploadRecord.shareable_link,
			expiresAt: uploadRecord.ttl,
		});
	} catch (err) {
		console.error(err);
		return c.json({ success: "false" }, 500);
	}
});

file.get("/:link", async (c) => {
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
