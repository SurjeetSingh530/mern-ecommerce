const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Logged-in user
router.post("/", protect, createOrder);

router.get("/myorders", protect, getMyOrders);

router.get("/:id", protect, getOrderById);

// Admin
router.get("/admin/all", protect, admin, getAllOrders);

router.put("/admin/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
