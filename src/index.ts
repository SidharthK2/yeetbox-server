import { Hono } from "hono";
import { health } from "./routes/health";

const app = new Hono();
app.get("/", (c) => c.text("welcome to yeetbox!"));
app.route("/health", health);

export default app;
