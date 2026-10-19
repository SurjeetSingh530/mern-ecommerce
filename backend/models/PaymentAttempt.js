const mongoose = require("mongoose");

const paymentAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String, required: true },
    },

    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      enum: ["Razorpay"],
      default: "Razorpay",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Failed", "Paid", "Refund Pending", "Refunded"],
      default: "Pending",
      required: true,
    },

    checkoutIntentId: { type: String, unique: true, sparse: true },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    razorpayRefundId: { type: String },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      unique: true,
      sparse: true,
    },
    paidAt: { type: Date, default: null },
    lastPaymentError: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentAttempt", paymentAttemptSchema);
