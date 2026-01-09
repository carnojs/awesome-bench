const fastify = require("fastify")({ logger: false });

fastify.get("/health", async (request, reply) => {
  return reply.code(200).send();
});

fastify.get("/plaintext", async (request, reply) => {
  return reply.type("text/plain; charset=utf-8").send("OK");
});

fastify.get("/json", async (request, reply) => {
  return reply.type("application/json; charset=utf-8").send({ message: "OK" });
});

fastify.listen({ port: 8080, host: "0.0.0.0" });
