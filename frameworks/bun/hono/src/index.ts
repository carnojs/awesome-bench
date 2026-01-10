import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.body(null, 200);
});

app.get("/plaintext", (c) => {
  return c.text("OK", 200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
});

app.get("/json", (c) => {
  return c.json({ message: "OK" }, 200, {
    "Content-Type": "application/json; charset=utf-8",
  });
});

app.post("/echo", async (c) => {
  const body = await c.req.json();
  return c.json(body);
});

app.get("/search", (c) => {
  const q = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "0", 10);
  return c.json({ query: q, limit });
});

app.get("/user/:id", (c) => {
  return c.json({ id: c.req.param("id") });
});

export default {
  port: 8080,
  fetch: app.fetch,
};
