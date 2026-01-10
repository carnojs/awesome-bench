Bun.serve({
  port: 8080,
  routes: {
    "/health": new Response(null, { status: 200 }),
    "/plaintext": new Response("OK", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }),
    "/json": Response.json(
      { message: "OK" },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    ),
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});
