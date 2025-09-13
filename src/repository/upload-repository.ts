import { db } from "../db/database";
import type { UploadUpdate, Upload, NewUpload } from "../db/types";

export async function findUploadById(id: string) {
	return await db
		.selectFrom("uploads")
		.where("id", "=", id)
		.selectAll()
		.executeTakeFirst();
}

export async function findUploads(criteria: Partial<Upload>) {
	let query = db.selectFrom("uploads");

	if (criteria.id) {
		query = query.where("id", "=", criteria.id);
	}

	if (criteria.shareable_link) {
		query = query.where("shareable_link", "=", criteria.shareable_link);
	}

	if (criteria.s3_link) {
		query = query.where("s3_link", "=", criteria.s3_link);
	}

	if (criteria.ttl) {
		query = query.where("ttl", "=", criteria.ttl);
	}

	if (criteria.uploader) {
		query = query.where("uploader", "=", criteria.uploader);
	}

	return await query.selectAll().execute();
}

export async function findUploadsByUser(uploaderId: string) {
	return await db
		.selectFrom("uploads")
		.where("uploader", "=", uploaderId)
		.selectAll()
		.execute();
}

export async function findUploadByShareableLink(shareableLink: string) {
	return await db
		.selectFrom("uploads")
		.where("shareable_link", "=", shareableLink)
		.selectAll()
		.executeTakeFirst();
}

export async function updateUpload(id: string, updateWith: UploadUpdate) {
	await db
		.updateTable("uploads")
		.set(updateWith)
		.where("id", "=", id)
		.execute();
}

export async function createUpload(upload: NewUpload) {
	return await db
		.insertInto("uploads")
		.values(upload)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function deleteUpload(id: string) {
	return await db
		.deleteFrom("uploads")
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst();
}

export async function deleteUploadsByUser(uploaderId: string) {
	return await db
		.deleteFrom("uploads")
		.where("uploader", "=", uploaderId)
		.returningAll()
		.execute();
}

export async function totalUploads() {
	const allUploads = await db.selectFrom("uploads").selectAll().execute();
	return allUploads.length;
}

export async function totalUploadsByUser(uploaderId: string) {
	const userUploads = await db
		.selectFrom("uploads")
		.where("uploader", "=", uploaderId)
		.selectAll()
		.execute();
	return userUploads.length;
}
