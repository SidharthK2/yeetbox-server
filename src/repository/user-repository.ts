import { db } from "../db/database";
import type { UserUpdate, User, NewUser } from "../db/types";

export async function findUserById(id: string) {
	return await db
		.selectFrom("users")
		.where("id", "=", id)
		.selectAll()
		.executeTakeFirst();
}

export async function findUsers(criteria: Partial<User>) {
	let query = db.selectFrom("users");

	if (criteria.id) {
		query = query.where("id", "=", criteria.id); // Kysely is immutable, you must re-assign!
	}

	if (criteria.bearer_token) {
		query = query.where("bearer_token", "=", criteria.bearer_token);
	}

	if (criteria.created_at) {
		query = query.where("created_at", "=", criteria.created_at);
	}

	return await query.selectAll().execute();
}

export async function updateUser(id: string, updateWith: UserUpdate) {
	await db.updateTable("users").set(updateWith).where("id", "=", id).execute();
}

export async function createUser(person: NewUser) {
	return await db
		.insertInto("users")
		.values(person)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function deleteUser(id: string) {
	return await db
		.deleteFrom("users")
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst();
}

export async function totalUsers() {
	const allUsers = await db.selectFrom("users").selectAll().execute();
	return allUsers.length;
}
