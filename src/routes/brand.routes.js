import express from "express";
import {
  addBrand,
  getBrands,
  getBrandBySlug,
} from "../controllers/brands.controller.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Brands router working!");
});

// A get brands endpoint;
router.get("/", getBrands);

router.post("/", addBrand);

router.get("/:slug", getBrandBySlug);

export default router;
