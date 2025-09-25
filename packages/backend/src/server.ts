import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { searchUnlocode } from "./search";

const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));

app.get("/api/search", async (c) => {
  try {
    const q = c.req.query("q") ?? null;
    const data = await searchUnlocode(q);
    return c.json(data);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend listening on http://localhost:${port}`);
