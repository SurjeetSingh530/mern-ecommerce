const Order = require("../models/Order");
const Product = require("../models/Product");
const { calculateOrderSnapshot } = require("../utils/orderPricing");

// CREATE ORDER
const createOrder = async (req, res) => {
  let session;
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== "COD") {
      return res.status(400).json({
        message: "Online orders must use the secure Razorpay checkout",
      });
    }

    session = await Order.startSession();
    let createdOrderId;

    await session.withTransaction(async () => {
      const snapshot = await calculateOrderSnapshot(
        req.body.orderItems,
        req.body.shippingAddress,
        session,
      );

      for (const item of snapshot.orderItems) {
        const result = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw Object.assign(
            new Error(`${item.name} does not have enough stock`),
            {
              statusCode: 409,
            },
          );
        }
      }

      const [order] = await Order.create(
        [
          {
            user: req.user._id,
            ...snapshot,
            paymentMethod: "COD",
            paymentStatus: "Pending",
            orderStatus: "Processing",
          },
        ],
        { session },
      );
      createdOrderId = order._id;
    });

    const populatedOrder = await Order.findById(createdOrderId)
      .populate("user", "name email")
      .populate("orderItems.product");

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Unable to create order",
    });
  } finally {
    if (session) await session.endSession();
  }
};

// GET LOGGED-IN USER ORDERS
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET SINGLE ORDER
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // User can only see own order
    // Admin can see any order
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not authorized to view this order",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADMIN - GET ALL ORDERS
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADMIN - UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.paymentMethod === "Razorpay" &&
      order.paymentStatus !== "Paid" &&
      !(order.paymentStatus === "Failed" && orderStatus === "Cancelled")
    ) {
      return res.status(409).json({
        message: "An unpaid Razorpay order cannot be advanced or cancelled",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
