const express = require("express");

const {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// =========================
// REGISTER
// =========================

router.post("/register", registerUser);

// =========================
// EMAIL VERIFICATION OTP
// =========================

router.post("/verify-email-otp", verifyEmailOTP);

// =========================
// RESEND EMAIL OTP
// =========================

router.post("/resend-email-otp", resendEmailOTP);

// =========================
// LOGIN
// =========================

router.post("/login", loginUser);

// =========================
// FORGOT PASSWORD
// =========================

router.post("/forgot-password", forgotPassword);

// =========================
// VERIFY RESET OTP
// =========================

router.post("/verify-reset-otp", verifyResetOTP);

// =========================
// RESET PASSWORD
// =========================

router.post("/reset-password", resetPassword);

module.exports = router;
