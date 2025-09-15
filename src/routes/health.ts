import { Hono } from "hono";
import { totalUsers } from "../repository/user-repository";
import { client } from "../integrations/redis";

export const health = new Hono();

health.get("/", async (c) => {
	let statusString = "";
	try {
		await totalUsers();
		statusString += "DB healthy ";
		await client.ping();
		statusString += "Redis healthy ";
		return c.json({ database: statusString }, 200);
	} catch (error) {
		console.error("Health check failed:", error);

		return c.json(
			{
				status: "error",
				database: "unhealthy",
				message:
					error instanceof Error
						? error.message
						: "An unknown database error occurred",
			},
			503,
		);
	}
});
