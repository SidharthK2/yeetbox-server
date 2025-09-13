import { findUsers, createUser } from "../repository/user-repository";

export async function userService(token: string | null) {
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
	if (!user) throw new Error("User not found!");
	return { id: user[0].id, bearer_token: user[0].bearer_token };
}
