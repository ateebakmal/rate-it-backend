import express from "express";

import {
  addReview,
  getReviewsForBrand,
} from "../controllers/reviews.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, addReview);

router.get("/:slug", getReviewsForBrand);

export default router;
