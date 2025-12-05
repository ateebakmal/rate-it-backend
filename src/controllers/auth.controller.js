import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validade Input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: false, data: { error: "All fields are required" } });
    }

    // 2. Check if email already registered
    const exisiting = await pool.query("SELECT FROM users WHERE email = $1", [
      email,
    ]);

    if (exisiting.rows.length > 0) {
      return res.status(409).json({
        success: false,
        data: { error: "Email already registered" },
      });
    }

    // 3. Hash the password and store it in backend
    const passwordHash = await bcrypt.hash(password, 10);

    // 4 Insert the user into db
    const result = await pool.query(
      `INSERT INTO users (name , email, password_hash)
            VALUES ($1 , $2, $3)
            RETURNING user_id , name , email , created_at
            `,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    console.log(user);

    // TODO : JWT Authentication
    // 5. Do JWT authentication

    res.status(201).json({
      success: true,
      data: { message: "Signup successful" },
    });
  } catch (error) {
    console.error("Signup Error: ", error);
    res.statusd(500).json({
      success: false,
      data: { error: "Internal Server Error" },
    });
  }
}
