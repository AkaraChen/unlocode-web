import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getCountryDetail, searchUnlocode } from "./search";

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

app.get("/api/countries/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const data = await getCountryDetail(code);
    return c.json(data);
  } catch (error) {
    console.error(error);
    if (typeof error === "object" && error && "status" in error) {
      const status = Number.parseInt(String((error as { status: number }).status), 10);
      if (status === 404) {
        return c.json({ message: "Country not found" }, 404);
      }
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend listening on http://localhost:${port}`);
