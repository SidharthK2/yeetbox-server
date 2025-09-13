import { db } from "../db/database";
import type { UserUpdate, User, NewUser } from "../db/types";

export async function findPersonById(id: number) {
	return await db
		.selectFrom("user")
		.where("id", "=", id)
		.selectAll()
		.executeTakeFirst();
}

export async function findPeople(criteria: Partial<User>) {
	let query = db.selectFrom("user");

	if (criteria.id) {
		query = query.where("id", "=", criteria.id); // Kysely is immutable, you must re-assign!
	}

	if (criteria.bearerToken) {
		query = query.where("bearerToken", "=", criteria.bearerToken);
	}

	if (criteria.created_at) {
		query = query.where("created_at", "=", criteria.created_at);
	}

	return await query.selectAll().execute();
}

export async function updatePerson(id: number, updateWith: UserUpdate) {
	await db.updateTable("user").set(updateWith).where("id", "=", id).execute();
}

export async function createPerson(person: NewUser) {
	return await db
		.insertInto("user")
		.values(person)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function deletePerson(id: number) {
	return await db
		.deleteFrom("user")
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst();
}
