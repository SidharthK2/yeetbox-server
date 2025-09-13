import { Hono } from "hono";
import { userService } from "../services/user-service";
import { setCookie } from "hono/cookie";
import { putObject, BUCKET_URL, getObject } from "../integrations/s3";
import {
	createUpload,
	findUploadByShareableLink,
} from "../repository/upload-repository";

type Variables = {
	bearer_token: string;
};

export const file = new Hono<{ Variables: Variables }>();

file.post("/upload", async (c) => {
	try {
		const token = c.get("bearer_token");
		const { id, bearer_token } = await userService(token);
		setCookie(c, "bearer_token", bearer_token, { httpOnly: true });
		const body = await c.req.parseBody();
		const file = body.file as File;
		const { result, s3Key } = await putObject(file);
		const s3Url = `${BUCKET_URL}${s3Key}`;
		const uploadRecord = await createUpload({
			id: crypto.randomUUID(),
			shareable_link: crypto.randomUUID(), //TODO: uuid for now replace
			s3_link: s3Url,
			ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			uploader: id,
		});

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

file.get("/:id", async (c) => {
	try {
		const shareId = c.req.param("id");
		const upload = await findUploadByShareableLink(shareId);
		if (!upload) return c.json({ message: "Could not find upload" }, 404);
		const res = await getObject(upload.s3_link);
		//somehow stream file to user
		return c.json({ success: "true" });
	} catch (err) {
		console.error(err);
		return c.json({ message: err instanceof Error ? err.message : err }, 500);
	}
});
