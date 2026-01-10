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

export default {
  port: 8080,
  fetch: app.fetch,
};
