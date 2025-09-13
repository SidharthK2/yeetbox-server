import { Hono } from "hono";
import { health } from "./routes/health";
import { file } from "./routes/file";
import { cookieHelper } from "./middleware";

const app = new Hono();

app.use("/file/*", cookieHelper);

app.get("/", (c) => c.text("welcome to yeetbox!"));
app.route("/health", health);
app.route("/file", file);

export default app;
