import type { Database } from "./types.ts";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const dialect = new PostgresDialect({
	pool: new Pool({
		database: "railway",
		host: "trolley.proxy.rlwy.net",
		user: "postgres",
		password: Bun.env.DB_PASSWORD,
		port: 31455,
		max: 10,
	}),
});
export const db = new Kysely<Database>({
	dialect,
});
