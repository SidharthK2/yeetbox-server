import { generate } from "random-words";
import { checkSharableLinkExists } from "../integrations/redis";
import { findUsers, createUser } from "../repository/user-repository";

export async function findOrCreateUser(deviceFingerprint: string) {
    const users = await findUsers({ bearer_token: deviceFingerprint });

    if (users.length > 0) {
        return { id: users[0].id, bearer_token: users[0].bearer_token };
    }

    const id = crypto.randomUUID();
    const user = await createUser({
        id,
        bearer_token: deviceFingerprint, // Device fingerprint IS the token
    });

    return { id, bearer_token: user.bearer_token };
}

export async function generateUniqueShareableLink(uuid: string) {
    for (let i = 0; i < 3; i++) {
        const randomString = generate({ minLength: 4, exactly: 2, join: "" });
        if (!(await checkSharableLinkExists(randomString))) return randomString;
    }
    return uuid;
}