import pool from "../config/db.js";

export async function getCategories(req, res) {
  try {
    const result = await pool.query("SELECT * FROM categories");
    res.status(200).json({
      success: true,
      data: {
        categories: result.rows,
      },
    });
  } catch (error) {
    console.error("Get categories Error", error);
    res
      .status(500)
      .json({ success: false, error: "Error fetching categories" });
  }
}
