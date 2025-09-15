import { generate } from "random-words";
import { checkSharableLinkExists } from "../integrations/redis";
import { findUsers, createUser } from "../repository/user-repository";

export async function findOrCreateUser(token: string | null) {
	if (!token) {
		const id = crypto.randomUUID();
		const bearer_token = crypto.randomUUID();
		await createUser({
			id,
			bearer_token,
		});
		return { id, bearer_token };
	}
	const user = await findUsers({ bearer_token: token });
	if (!user) throw new Error("Invalid token!");
	return { id: user[0].id, bearer_token: user[0].bearer_token };
}

export async function generateUniqueShareableLink(uuid: string) {
	for (let i = 0; i < 3; i++) {
		const randomString = generate({ minLength: 4, exactly: 2, join: "" });
		if (!(await checkSharableLinkExists(randomString))) return randomString;
	}
	return uuid;
}
