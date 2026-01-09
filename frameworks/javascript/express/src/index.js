const express = require("express");

const app = express();

app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/plaintext", (req, res) => {
  res.type("text/plain; charset=utf-8").send("OK");
});

app.get("/json", (req, res) => {
  res.type("application/json; charset=utf-8").json({ message: "OK" });
});

app.listen(8080);
