import * as path from "node:path";
import { Pool } from "pg";
import { promises as fs } from "node:fs";
import fsSync from "node:fs";
import {
	Kysely,
	Migrator,
	PostgresDialect,
	FileMigrationProvider,
} from "kysely";
import type { Database } from "../types";

async function migrateToLatest() {
	const dialect = new PostgresDialect({
		pool: new Pool({
			user: "upadmin",
			password: Bun.env.DB_PASSWORD,
			host: Bun.env.DB_HOST,
			port: 11569,
			database: "defaultdb",
			max: 10,
			ssl: {
				ca: fsSync.readFileSync("./ca.pem").toString(),
			},
		}),
	});
	const db = new Kysely<Database>({
		dialect,
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, "../migrations"),
		}),
	});

	const { error, results } = await migrator.migrateToLatest();

	if (results) {
		for (const it of results) {
			if (it.status === "Success") {
				console.log(
					`migration "${it.migrationName}" was executed successfully`,
				);
			} else if (it.status === "Error") {
				console.error(`failed to execute migration "${it.migrationName}"`);
			}
		}
	}

	if (error) {
		console.error("failed to migrate");
		console.error(error);
		process.exit(1);
	}

	await db.destroy();
}

migrateToLatest();
