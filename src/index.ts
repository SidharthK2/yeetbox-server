import { Hono } from "hono";
const app = new Hono();

app.get("/", (c) => c.text("Hono!"));
console.log("Server running on port 3000");

export default app;
