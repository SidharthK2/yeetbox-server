import { createMiddleware } from "hono/factory";
import { generateDeviceFingerprint } from "../utils/crypto.ts";

export const cookieHelper = createMiddleware(async (c, next) => {
    const headers = {
        'user-agent': c.req.header('user-agent'),
        'accept-language': c.req.header('accept-language'),
        'accept-encoding': c.req.header('accept-encoding'),
    };

    const deviceFingerprint = await generateDeviceFingerprint(headers);

    c.set("bearer_token", deviceFingerprint);
    await next();
});