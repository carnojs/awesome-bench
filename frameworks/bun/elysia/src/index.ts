import { Elysia } from "elysia";

new Elysia()
  .get("/health", () => new Response(null, { status: 200 }))
  .get("/plaintext", ({ set }) => {
    set.headers["Content-Type"] = "text/plain; charset=utf-8";
    return "OK";
  })
  .get("/json", ({ set }) => {
    set.headers["Content-Type"] = "application/json; charset=utf-8";
    return { message: "OK" };
  })
  .listen(8080);
