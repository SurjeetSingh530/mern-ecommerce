import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetOTP = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");

    if (!savedEmail) {
      navigate("/forgot-password");
      return;
    }

    setEmail(savedEmail);
  }, [navigate]);

  const verifyOTP = async (e) => {
    e.preventDefault();

    setError("");

    if (otp.length !== 6) {
      setError("Enter a 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://mern-ecommerce-fgzj.onrender.com/api/auth/verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      const resetToken = data.resetToken;

      if (!resetToken) {
        throw new Error("Reset token was not received from server.");
      }

      sessionStorage.setItem("resetEmail", email);
      sessionStorage.setItem("resetOTPVerified", "true");
      sessionStorage.setItem("resetToken", resetToken);

      if (!sessionStorage.getItem("resetToken")) {
        throw new Error("Reset token could not be saved.");
      }

      navigate("/reset-password");
    } catch (error) {
      setError(error.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h2>Enter Reset OTP</h2>

        <p>OTP sent to</p>

        <strong>{email}</strong>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={verifyOTP}>
          <input
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              setOtp(value);
            }}
            placeholder="000000"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetOTP;
