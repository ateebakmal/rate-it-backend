import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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
  }
});
export default app;
