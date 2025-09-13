import { createUser } from "../../repository/user-repository";
import type { NewUser } from "../types";

async function seedUsers() {
	try {
		console.log("Seeding users table...");

		// Sample user data
		const users: NewUser[] = [
			{
				bearer_token: "user_001_token_abc123",
			},
			{
				bearer_token: "user_002_token_def456",
			},
			{
				bearer_token: "user_003_token_ghi789",
			},
			{
				bearer_token: "user_004_token_jkl012",
			},
			{
				bearer_token: "user_005_token_mno345",
			},
		];

		// Create users using repository method
		for (const user of users) {
			const createdUser = await createUser(user);
			console.log(
				`Created user with ID: ${createdUser.id}, token: ${createdUser.bearer_token}`,
			);
		}

		console.log("Seeding completed successfully!");
	} catch (error) {
		console.error("Error seeding users:", error);
		process.exit(1);
	}
}

seedUsers();
