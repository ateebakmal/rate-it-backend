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

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validate Email and Password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and Password are required",
      });
    }

    // 2. Get user from db
    const results = await pool.query(
      `
      SELECT user_id, name, email, password_hash FROM users WHERE email = $1
      `,
      [email]
    );

    const user = results.rows[0];

    // 2.1 check if users exists
    if (results.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: "User doesnt exist",
      });
    }

    // 3. Compare passwords
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        success: false,
        error: "Invalid Email or Password",
      });
    }

    // 4. Generate a JSON web token
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET);

    res.status(200).json({
      success: true,
      data: {
        message: "Login Succesful",
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.log("-------ERROR---------:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
