const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC USER INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =========================
    // EMAIL VERIFICATION
    // =========================

    isVerified: {
      type: Boolean,
      default: false,
    },

    // =========================
    // OTP
    // =========================

    otp: {
      type: String,
      default: "",
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    otpPurpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    // =========================
    // PASSWORD RESET TOKEN
    // =========================

    resetPasswordToken: {
      type: String,
      default: "",
    },

    resetPasswordTokenExpires: {
      type: Date,
      default: null,
    },

    // =========================
    // USER DETAILS
    // =========================

    phone: {
      type: String,
      default: "",
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    // =========================
    // ADMIN
    // =========================

    isAdmin: {
      type: Boolean,
      default: false,
    },

    // =========================
    // WISHLIST
    // =========================

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
