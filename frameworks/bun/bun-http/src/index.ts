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
    "/echo": {
      POST: async (req) => {
        const body = await req.json();
        return Response.json(body);
      },
    },
    "/search": (req) => {
      const url = new URL(req.url);
      const q = url.searchParams.get("q") || "";
      const limit = parseInt(url.searchParams.get("limit") || "0", 10);
      return Response.json({ query: q, limit });
    },
    "/user/:id": (req) => {
      return Response.json({ id: req.params.id });
    },
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});
