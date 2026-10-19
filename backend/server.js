require("dotenv").config();

const dns = require("dns");
const express = require("express");
const dotenv = require("dotenv");

const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Load environment variables
dotenv.config();

console.log("JWT_SECRET:", process.env.JWT_SECRET ? "LOADED" : "MISSING");
console.log(
  "RAZORPAY_KEY_ID:",
  process.env.RAZORPAY_KEY_ID ? "LOADED" : "MISSING",
);
console.log(
  "RAZORPAY_KEY_SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "LOADED" : "MISSING",
);
console.log(
  "RAZORPAY_WEBHOOK_SECRET:",
  process.env.RAZORPAY_WEBHOOK_SECRET
    ? "LOADED (webhooks enabled)"
    : "MISSING (webhook endpoint will reject requests)",
);

// MongoDB Atlas DNS fix
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Debug MongoDB environment variable
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

if (process.env.MONGODB_URI) {
  console.log("MONGODB_URI host:", process.env.MONGODB_URI.split("@")[1]);
}

// Connect MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buffer) => {
      if (req.originalUrl.startsWith("/api/payment/webhook")) {
        req.rawBody = Buffer.from(buffer);
      }
    },
  }),
);

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

// Home
app.get("/", (req, res) => {
  res.json({
    message: "E-Commerce API is running",
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
