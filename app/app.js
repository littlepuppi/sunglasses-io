const express = require('express');

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/brands", (req, res) => {
  res.status(200).json([]);
});

app.get("/api/products", (req, res) => {
  res.status(200).json([]);
});

app.post("/api/login", (req, res) => {
  res.status(400).json({ error: "Missing credentials" });
});

app.get("/api/me/cart", (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

app.post("/api/me/cart", (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

app.delete("/api/me/cart/:productId", (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

app.post("/api/me/cart/:productId", (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

module.exports = app;
