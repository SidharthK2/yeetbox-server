import type { Database } from "./types.ts";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import fs from "node:fs";

const dialect = new PostgresDialect({
	pool: new Pool({
		user: "upadmin",
		password: Bun.env.DB_PASSWORD,
		host: Bun.env.DB_HOST,
		port: 11569,
		database: "defaultdb",
		max: 10,
		ssl: {
			ca: fs.readFileSync("./ca.pem").toString(),
		},
	}),
});
export const db = new Kysely<Database>({
	dialect,
});
