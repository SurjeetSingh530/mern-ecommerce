const express = require("express");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getWishlist);

router.post("/", protect, addToWishlist);

router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
