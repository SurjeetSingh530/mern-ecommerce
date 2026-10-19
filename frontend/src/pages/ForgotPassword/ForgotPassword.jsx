import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // STEP 1 - SEND OTP
  // =====================================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      sessionStorage.setItem("resetEmail", email);
      sessionStorage.removeItem("resetOTPVerified");
      sessionStorage.removeItem("resetToken");
      navigate("/verify-reset-otp");
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 2 - VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }

      // OTP verified
      sessionStorage.setItem("resetOTPVerified", "true");

      setMessage(data.message || "OTP verified successfully");

      // IMPORTANT:
      // OTP verify hone ke baad STEP 3
      setTimeout(() => {
        setMessage("");
        setStep(3);
      }, 800);
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 3 - RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!newPassword) {
      setError("Please enter new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Password reset failed");
        return;
      }

      setMessage(data.message || "Password reset successfully");

      // Clear session data
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetOTPVerified");

      // Clear form
      setNewPassword("");
      setConfirmPassword("");

      // Login page par redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error(error);

      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <>
            <h1>Forgot Password?</h1>

            <p className="forgot-subtitle">
              Enter your registered email address and we will send you an OTP.
            </p>

            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button
                type="submit"
                className="forgot-button"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <>
            <h1>Verify OTP</h1>

            <p className="forgot-subtitle">We have sent a 6-digit OTP to:</p>

            <p className="reset-email">{email}</p>

            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>Enter OTP</label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    setOtp(value);
                  }}
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              {message && <p className="success-message">{message}</p>}

              <button
                type="submit"
                className="forgot-button"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <>
            <h1>Reset Password</h1>

            <p className="forgot-subtitle">Enter your new password.</p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>

                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              {message && <p className="success-message">{message}</p>}

              <button
                type="submit"
                className="forgot-button"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* LOGIN LINK */}

        <p className="back-login">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
