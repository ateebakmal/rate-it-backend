import pool from "../config/db.js";

export async function addReview(req, res) {
  try {
    const { slug, rating, heading, review } = req.body;

    // 1. User ID always comes from JWT
    const user_id = req.user.user_id;

    // 2. Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // 3. Validate slug
    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Brand slug is required",
      });
    }

    // 4. Find brand_id using slug
    const brandResult = await pool.query(
      "SELECT brand_id FROM brands WHERE slug = $1",
      [slug]
    );

    if (brandResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Brand not found",
      });
    }

    const brand_id = brandResult.rows[0].brand_id;

    // 5. Insert review
    const insertResult = await pool.query(
      `
      INSERT INTO reviews (user_id, brand_id, rating, heading, review)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING review_id, rating, heading, review, created_at
      `,
      [user_id, brand_id, rating, heading || null, review || null]
    );

    // 6. Recalculate rating for brand
    await pool.query(
      `
      UPDATE brands
      SET 
        review_count = (SELECT COUNT(*) FROM reviews WHERE brand_id = $1),
        average_rating = (
          SELECT AVG(rating)::numeric(2,1)
          FROM reviews
          WHERE brand_id = $1
        )
      WHERE brand_id = $1
      `,
      [brand_id]
    );

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: {
        review: insertResult.rows[0],
      },
    });
  } catch (error) {
    // Duplicate review (user already reviewed)
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this brand",
      });
    }

    console.error("Add Review Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// export async function getReviewsForBrand(req, res) {
//   try {
//     const { slug } = req.params;

//     if (!slug) {
//       return res.status(400).json({
//         success: false,
//         error: "Brand slug is required",
//       });
//     }

//     // 1. Check if brand exists & get brand_id
//     const brandResult = await pool.query(
//       `SELECT brand_id, name FROM brands WHERE slug = $1`,
//       [slug]
//     );

//     if (brandResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "Brand not found",
//       });
//     }

//     const brand_id = brandResult.rows[0].brand_id;

//     // 2. Fetch reviews for the brand
//     const reviewsResult = await pool.query(
//       `
//       SELECT
//         r.review_id,
//         r.rating,
//         r.heading,
//         r.review,
//         r.created_at,
//         u.user_id,
//         u.name AS user_name
//       FROM reviews r
//       JOIN users u ON u.user_id = r.user_id
//       WHERE r.brand_id = $1
//       ORDER BY r.created_at DESC
//       `,
//       [brand_id]
//     );

//     res.status(200).json({
//       success: true,
//       brand: brandResult.rows[0].name,
//       slug,
//       total: reviewsResult.rows.length,
//       data: {
//         reviews: reviewsResult.rows,
//       },
//     });
//   } catch (error) {
//     console.error("Get Reviews Error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch reviews",
//     });
//   }
// }

export async function getReviewsForBrand(req, res) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Brand slug is required",
      });
    }

    // 1. Check if brand exists
    const brandResult = await pool.query(
      `SELECT brand_id, name FROM brands WHERE slug = $1`,
      [slug]
    );

    if (brandResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Brand not found",
      });
    }

    const brand_id = brandResult.rows[0].brand_id;

    // 2. Fetch all reviews
    const reviewsResult = await pool.query(
      `
      SELECT 
        r.review_id,
        r.rating,
        r.heading,
        r.review,
        r.created_at,
        u.user_id,
        u.name AS user_name
      FROM reviews r
      JOIN users u ON u.user_id = r.user_id
      WHERE r.brand_id = $1
      ORDER BY r.created_at DESC
      `,
      [brand_id]
    );

    // 3. Get rating breakdown (count per star)
    const ratingCountsResult = await pool.query(
      `
      SELECT rating, COUNT(*) AS count
      FROM reviews
      WHERE brand_id = $1
      GROUP BY rating
      ORDER BY rating ASC
      `,
      [brand_id]
    );

    // Build a complete map → ensure 1–5 always exist
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratingCountsResult.rows.forEach((row) => {
      ratingCounts[row.rating] = parseInt(row.count);
    });

    // 4. Respond
    res.status(200).json({
      success: true,
      brand: brandResult.rows[0].name,
      slug,
      totalReviews: reviewsResult.rows.length,
      ratingCounts, // ⭐ counts of each rating
      data: {
        reviews: reviewsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
}
