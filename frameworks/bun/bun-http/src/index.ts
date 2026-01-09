Bun.serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(null, { status: 200 });
    }

    if (url.pathname === "/plaintext") {
      return new Response("OK", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/json") {
      return Response.json(
        { message: "OK" },
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});
