import pool from "./config/db.js";

/* ---------- Utility ---------- */
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ---------- Brands to Seed ---------- */
const brands = [
  /* ===================== CLOTHING ===================== */
  {
    name: "Junaid Jamshed",
    description: "Leading Pakistani clothing, fragrances and lifestyle brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://www.junaidjamshed.com",
  },
  {
    name: "Ideas by Gul Ahmed",
    description: "Clothing, home textiles and lifestyle brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://www.gulahmedshop.com",
  },
  {
    name: "Khaadi",
    description: "One of Pakistan’s largest fashion and apparel brands.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://www.khaadi.com",
  },
  {
    name: "Sapphire",
    description: "Modern eastern and western clothing brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://pk.sapphireonline.pk",
  },
  {
    name: "Outfitters",
    description: "Trendy western wear and casual clothing brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://outfitters.com.pk",
  },
  {
    name: "Breakout",
    description: "Youth-focused casual and streetwear clothing brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://breakout.com.pk",
  },
  {
    name: "Vulpes Corsac",
    description: "Premium Pakistani menswear brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://vulpescorsac.com",
  },
  {
    name: "Bonanza Satrangi",
    description: "Eastern wear and unstitched fabric brand.",
    category: "clothing",
    platform: "WEBSITE",
    url: "https://bonanzasatrangi.com",
  },

  /* ===================== ELECTRONICS ===================== */
  {
    name: "Ronin",
    description:
      "Pakistani brand offering mobile accessories and smart gadgets.",
    category: "electronics",
    platform: "WEBSITE",
    url: "https://ronin.pk",
  },
  {
    name: "Dawlance",
    description: "Pakistani home appliances manufacturer.",
    category: "electronics",
    platform: "WEBSITE",
    url: "https://www.dawlance.com.pk",
  },
  {
    name: "Audionic",
    description: "Audio accessories, speakers and headphones brand.",
    category: "electronics",
    platform: "WEBSITE",
    url: "https://audionic.co",
  },
  {
    name: "Zero Lifestyle",
    description: "Smart watches and tech accessories brand.",
    category: "electronics",
    platform: "WEBSITE",
    url: "https://zerolifestyle.co",
  },

  /* ===================== BEAUTY ===================== */
  {
    name: "Bagallery",
    description: "Beauty, cosmetics and lifestyle products store.",
    category: "beauty",
    platform: "INSTAGRAM",
    url: "https://www.instagram.com/bagallery",
  },
  {
    name: "Luscious Cosmetics",
    description: "Pakistani cosmetics and beauty brand.",
    category: "beauty",
    platform: "WEBSITE",
    url: "https://lusciouscosmetics.pk",
  },
  {
    name: "Medora",
    description: "Makeup and cosmetics brand.",
    category: "beauty",
    platform: "WEBSITE",
    url: "https://medora.pk",
  },

  /* ===================== FOOD ===================== */
  {
    name: "Cheezious",
    description: "Fast food and pizza chain.",
    category: "food",
    platform: "WEBSITE",
    url: "https://cheezious.com",
  },
  {
    name: "OPTP",
    description: "Popular fries and fast food chain.",
    category: "food",
    platform: "WEBSITE",
    url: "https://optp.biz",
  },
  {
    name: "Howdy",
    description: "Burger and fast food brand.",
    category: "food",
    platform: "WEBSITE",
    url: "https://howdy.pk",
  },

  /* ===================== HOME GOODS ===================== */
  {
    name: "ChenOne",
    description: "Luxury home decor and furniture brand.",
    category: "home goods",
    platform: "WEBSITE",
    url: "https://www.chenone.com",
  },
  {
    name: "Master MoltyFoam",
    description: "Mattresses, furniture and home solutions.",
    category: "home goods",
    platform: "WEBSITE",
    url: "https://www.moltyfoam.com.pk",
  },
];

/* ---------- Load Existing Categories ---------- */
async function getCategoryMap() {
  const { rows } = await pool.query(
    "SELECT category_id, LOWER(name) AS name FROM categories"
  );

  const map = new Map();
  rows.forEach((row) => map.set(row.name, row.category_id));
  return map;
}

/* ---------- Insert Brand ---------- */
async function insertBrand(brand, categoryMap) {
  const categoryId = categoryMap.get(brand.category);

  if (!categoryId) {
    throw new Error(`Category not found in DB: ${brand.category}`);
  }

  const slug = slugify(brand.name);

  await pool.query(
    `
    INSERT INTO brands
      (name, slug, description, category_id, image_url, primary_platform, primary_url)
    VALUES
      ($1, $2, $3, $4, NULL, $5, $6)
    ON CONFLICT (slug) DO NOTHING
    `,
    [
      brand.name,
      slug,
      brand.description || null,
      categoryId,
      brand.platform,
      brand.url,
    ]
  );
}

/* ---------- Main ---------- */
async function seed() {
  try {
    console.log("\n🌱 Seeding demo brands...\n");

    const categoryMap = await getCategoryMap();

    for (const brand of brands) {
      await insertBrand(brand, categoryMap);
      console.log(`✅ Inserted or skipped: ${brand.name}`);
    }

    console.log("\n🎉 Brand seeding complete\n");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
