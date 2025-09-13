import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("users")
		.addColumn("id", "uuid", (col) => col.primaryKey())
		.addColumn("bearer_token", "text", (col) => col.unique().notNull())
		.addColumn("created_at", "date", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.execute();

	await db.schema
		.createTable("uploads")
		.addColumn("id", "uuid", (col) => col.primaryKey())
		.addColumn("shareable_link", "text", (col) => col.unique().notNull())
		.addColumn("s3_link", "text", (col) => col.unique().notNull())
		.addColumn("ttl", "timestamp", (col) => col.notNull())
		.addColumn("uploader", "uuid", (col) =>
			col.references("users.id").onDelete("cascade").notNull(),
		)
		.execute();
}
