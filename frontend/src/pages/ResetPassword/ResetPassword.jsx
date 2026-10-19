import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasResetSession =
      sessionStorage.getItem("resetEmail") &&
      sessionStorage.getItem("resetOTPVerified") === "true" &&
      sessionStorage.getItem("resetToken");

    if (!hasResetSession) {
      navigate("/forgot-password", { replace: true });
    }
  }, [navigate]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const resetToken = sessionStorage.getItem("resetToken");
    const otpVerified = sessionStorage.getItem("resetOTPVerified") === "true";

    if (!resetToken || !otpVerified) {
      setError("Your reset session is invalid. Please request a new OTP.");
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
          body: JSON.stringify({ resetToken, newPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetOTPVerified");
      sessionStorage.removeItem("resetToken");
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />

          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        <p className="back-login">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
