import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.routes.js";
import categoriesRouters from "./routes/categories.routes.js";
import appRoutes from "./routes/brand.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/categories", categoriesRouters);

app.use("/api/brands", appRoutes);

app.use("/api/reviews", reviewRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

import pool from "./config/db.js";
app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ db: "up" });
  } catch (err) {
    res.status(500).json({ db: "down", error: err.message });
    console.error(err);
  }
});

// For learning JWT
app.post("/login", (req, res) => {
  const username = req.body.username;
  const user = { name: username };

  const access_token = jwt.sign(user, process.env.JWT_ACCESS_SECRET);

  res.json({ access_token });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["auhtorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(400);

  jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
export default app;
