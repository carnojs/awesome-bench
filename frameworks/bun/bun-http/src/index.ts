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
  async fetch(req) {
    const url = new URL(req.url);

    // POST /echo
    if (req.method === "POST" && url.pathname === "/echo") {
      const body = await req.json();
      return Response.json(body);
    }

    // GET /search?q=foo&limit=10
    if (url.pathname === "/search") {
      const q = url.searchParams.get("q") || "";
      const limit = parseInt(url.searchParams.get("limit") || "0", 10);
      return Response.json({ query: q, limit });
    }

    // GET /user/:id
    const userMatch = url.pathname.match(/^\/user\/([^\/]+)$/);
    if (userMatch) {
      return Response.json({ id: userMatch[1] });
    }

    return new Response("Not Found", { status: 404 });
  },
});
