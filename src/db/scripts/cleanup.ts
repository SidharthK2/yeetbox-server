import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { Database } from "../types";

async function cleanupDatabase() {
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

	const db = new Kysely<Database>({
		dialect,
	});

	try {
		console.log("🧹 Starting database cleanup...");

		// Get table names first
		const tables = await db.introspection.getTables();
		const tableNames = tables.map((table) => table.name);

		console.log(`Found tables: ${tableNames.join(", ")}`);

		// Drop all tables (order doesn't matter for DROP CASCADE)
		for (const tableName of tableNames) {
			console.log(`Dropping table: ${tableName}`);
			await db.schema.dropTable(tableName).ifExists().execute();
		}

		// Alternative: Drop all data but keep tables
		// Uncomment the following lines if you want to keep table structure:
		/*
		console.log("Truncating all tables...");
		await db.executeQuery(db.raw("TRUNCATE TABLE uploads, users CASCADE"));
		*/

		console.log("✅ Database cleanup completed successfully!");
		console.log("All tables have been dropped.");
	} catch (error) {
		console.error("❌ Error during database cleanup:", error);
		process.exit(1);
	} finally {
		await db.destroy();
	}
}

cleanupDatabase();
