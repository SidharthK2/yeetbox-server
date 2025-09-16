import { Hono } from "hono";
import { cors } from "hono/cors";
import { health } from "./routes/health";
import { file } from "./routes/file";
import { cookieHelper } from "./middleware";

const app = new Hono();
console.log("Environment: ", Bun.env.NODE_ENV);

const allowedOrigins = ["https://yeetbox.vercel.app"];

app.use(
	"/*",
	cors({
		origin: allowedOrigins,
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
		allowHeaders: ["Content-Type"],
	}),
);

app.use("/file/*", cookieHelper);

app.get("/", (c) => c.text("welcome to yeetbox!"));
app.route("/health", health);
app.route("/file", file);

export default {
	port: 3000,
	fetch: app.fetch,
};
