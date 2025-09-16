// src/db/database.ts

import type { Database } from "./types.ts";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const dialect = new PostgresDialect({
	pool: new Pool({
		user: "upadmin",
		password: Bun.env.DB_PASSWORD,
		host: Bun.env.DB_HOST,
		port: 5432,
		database: "defaultdb",
		max: 10,
	}),
});

export const db = new Kysely<Database>({
	dialect,
});
