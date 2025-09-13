import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

export const cookieHelper = createMiddleware(async (c, next) => {
	const token = getCookie(c, "bearer_token");
	c.set("bearer_token", token);
	await next();
});
