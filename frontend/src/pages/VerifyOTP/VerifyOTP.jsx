import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VerifyOTP.css";

const VerifyOTP = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("verificationEmail");

    if (!savedEmail) {
      navigate("/register");
      return;
    }

    setEmail(savedEmail);
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (typeof otp !== "string" || otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://mern-ecommerce-fgzj.onrender.com/api/auth/verify-email-otp",
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
        throw new Error(data.message);
      }

      sessionStorage.removeItem("verificationEmail");

      setMessage("Email verified successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const response = await fetch(
        "https://mern-ecommerce-fgzj.onrender.com/api/auth/resend-email-otp",
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
        throw new Error(data.message);
      }

      setMessage("New OTP has been sent to your email.");

      setOtp("");
    } catch (error) {
      setError(error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h2>Verify Your Email</h2>

        <p>Enter the 6-digit OTP sent to</p>

        <strong>{email}</strong>

        {error && <div className="error-message">{error}</div>}

        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleVerify}>
          <input
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button className="resend-btn" onClick={resendOTP} disabled={resending}>
          {resending ? "Sending..." : "Resend OTP"}
        </button>

        <p>
          Wrong email?{" "}
          <span className="back-link" onClick={() => navigate("/register")}>
            Register again
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
