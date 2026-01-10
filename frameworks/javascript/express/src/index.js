const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/plaintext", (req, res) => {
  res.type("text/plain; charset=utf-8").send("OK");
});

app.get("/json", (req, res) => {
  res.type("application/json; charset=utf-8").json({ message: "OK" });
});

app.post("/echo", (req, res) => {
  res.json(req.body);
});

app.get("/search", (req, res) => {
  const q = req.query.q || "";
  const limit = parseInt(req.query.limit || "0", 10);
  res.json({ query: q, limit });
});

app.get("/user/:id", (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(8080);
