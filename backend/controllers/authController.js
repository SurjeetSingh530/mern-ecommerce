const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ==========================================
// GENERATE 6 DIGIT OTP
// ==========================================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==========================================
// REGISTER USER
// ==========================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    let user = await User.findOne({ email });

    // User already exists
    if (user) {
      // Already verified
      if (user.isVerified) {
        return res.status(400).json({
          message: "User already registered. Please login.",
        });
      }

      // Existing but not verified
      const otp = generateOTP();

      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.otpPurpose = "email_verification";
      user.otpAttempts = 0;
      user.otpVerified = false;

      await user.save();

      await sendEmail({
        to: user.email,
        subject: "ShopCart Email Verification OTP",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Welcome to ShopCart</h2>

            <p>Your email verification OTP is:</p>

            <h1 style="letter-spacing: 5px;">
              ${otp}
            </h1>

            <p>This OTP will expire in 10 minutes.</p>

            <p>Please do not share this OTP with anyone.</p>
          </div>
        `,
      });

      return res.status(200).json({
        message:
          "Account already registered but not verified. A new OTP has been sent.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,

      phone: phone || "",

      isVerified: false,

      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),

      otpPurpose: "email_verification",

      otpAttempts: 0,

      otpVerified: false,

      resetPasswordToken: "",
      resetPasswordTokenExpires: null,
    });

    await user.save();

    // Send OTP
    await sendEmail({
      to: email,
      subject: "ShopCart Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome to ShopCart</h2>

          <p>Your email verification OTP is:</p>

          <h1 style="letter-spacing: 5px;">
            ${otp}
          </h1>

          <p>This OTP will expire in 10 minutes.</p>

          <p>Please do not share this OTP with anyone.</p>
        </div>
      `,
    });

    return res.status(201).json({
      message: "Registration successful. OTP sent to your email.",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// VERIFY EMAIL OTP
// ==========================================
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.otpPurpose !== "email_verification") {
      return res.status(400).json({
        message: "Invalid email verification request",
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;

      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Verification successful
    user.isVerified = true;

    user.otp = "";
    user.otpExpires = null;
    user.otpPurpose = null;
    user.otpAttempts = 0;
    user.otpVerified = false;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// RESEND EMAIL OTP
// ==========================================
const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified. Please login.",
      });
    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otpPurpose = "email_verification";

    user.otpAttempts = 0;

    user.otpVerified = false;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "ShopCart New Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>ShopCart Email Verification</h2>

          <p>Your new OTP is:</p>

          <h1 style="letter-spacing: 5px;">
            ${otp}
          </h1>

          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "New verification OTP sent successfully",
    });
  } catch (error) {
    console.error("Resend email OTP error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// LOGIN USER
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before login.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const role = user.isAdmin ? "admin" : "user";
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate password reset OTP
    const otp = generateOTP();

    user.otp = otp;

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otpPurpose = "password_reset";

    user.otpAttempts = 0;

    user.otpVerified = false;

    // Remove old reset token
    user.resetPasswordToken = "";
    user.resetPasswordTokenExpires = null;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "ShopCart Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">

          <h2>ShopCart Password Reset</h2>

          <p>
            We received a request to reset your password.
          </p>

          <p>
            Your password reset OTP is:
          </p>

          <h1 style="letter-spacing: 5px;">
            ${otp}
          </h1>

          <p>
            This OTP will expire in 10 minutes.
          </p>

          <p>
            If you did not request this, please ignore this email.
          </p>

        </div>
      `,
    });

    return res.status(200).json({
      message: "Password reset OTP sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// VERIFY RESET OTP
// ==========================================
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check OTP purpose
    if (user.otpPurpose !== "password_reset") {
      return res.status(400).json({
        message: "Invalid password reset request",
      });
    }

    // Check OTP expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      user.otpAttempts += 1;

      await user.save();

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ========================================
    // GENERATE RESET TOKEN
    // ========================================
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token in database
    user.resetPasswordToken = resetToken;

    user.resetPasswordTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    // OTP verified
    user.otpVerified = true;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",

      // IMPORTANT
      resetToken: resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Check required fields
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    // Password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Find user using reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,

      resetPasswordTokenExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // OTP must be verified
    if (!user.otpVerified) {
      return res.status(400).json({
        message: "Please verify OTP first",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // ========================================
    // CLEAR OTP DATA
    // ========================================
    user.otp = "";
    user.otpExpires = null;
    user.otpPurpose = null;
    user.otpAttempts = 0;
    user.otpVerified = false;

    // ========================================
    // CLEAR RESET TOKEN
    // ========================================
    user.resetPasswordToken = "";
    user.resetPasswordTokenExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};
