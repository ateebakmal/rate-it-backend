import pool from "../config/db.js";

// Utility function to create slug
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^\w\-]+/g, "") // remove invalid chars
    .replace(/\-\-+/g, "-"); // collapse multiple -
}

export async function addBrand(req, res) {
  console.log("addBrand Called");
  try {
    const {
      name,
      description,
      category_id,
      primary_platform,
      primary_url,
      image_url,
    } = req.body;
    // 1. Validate required fields
    if (!name || !category_id || !primary_platform || !primary_url) {
      console.log(req.body);
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // 2. Generate slug
    const slug = slugify(name);

    // 3. Check for duplicate brand
    const exists = await pool.query(
      "SELECT brand_id FROM brands WHERE slug = $1",
      [slug]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "brand already exists",
      });
    }

    // 4. insert brand
    const result = await pool.query(
      `
    INSERT INTO brands 
      (name, slug, description, category_id, primary_platform, primary_url, image_url)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING brand_id, slug
  `,
      [
        name,
        slug,
        description || null,
        category_id,
        primary_platform,
        primary_url,
        image_url || null,
      ]
    );

    console.log(result);
    return res.status(201).json({
      success: true,
      data: {
        data: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Error::::::  ", error);
    res.status(500).json({
      success: false,
      error: "Server error adding brand",
    });
  }
}

export async function getBrands(req, res) {
  try {
    const { search } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const values = [];
    let whereClause = "";

    if (search) {
      whereClause = `WHERE b.name ILIKE $1`;
      values.push(`%${search}%`);
    }

    /* --------- Total Count Query --------- */
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM brands b
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const totalBrands = countResult.rows[0].total;

    /* --------- Paginated Data Query --------- */
    const dataQuery = `
      SELECT
        b.brand_id,
        b.name,
        b.slug,
        b.image_url,
        b.average_rating,
        b.review_count,
        c.name AS category
      FROM brands b
      JOIN categories c ON c.category_id = b.category_id
      ${whereClause}
      ORDER BY b.name ASC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total: totalBrands,
      totalPages: Math.ceil(totalBrands / limit),
      results: dataResult.rows.length,
      data: {
        brands: dataResult.rows,
      },
    });
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch brands",
    });
  }
}

export async function getBrandBySlug(req, res) {
  try {
    const { slug } = req.params;
    const query = `
      SELECT
        b.brand_id,
        b.name,
        b.slug,
        b.description,
        b.image_url,
        b.primary_platform,
        b.primary_url,
        b.average_rating,
        b.review_count,
        c.name AS category
      FROM brands b
      JOIN categories c ON c.category_id = b.category_id
      WHERE b.slug = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        brand: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Get brands error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch brands",
    });
  }
}
