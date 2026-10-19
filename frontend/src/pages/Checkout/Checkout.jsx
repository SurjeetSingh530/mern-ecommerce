import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "./Checkout.css";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const createCheckoutIntentId = () => {
  if (window.crypto.randomUUID) return window.crypto.randomUUID();

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

const Checkout = () => {
  const navigate = useNavigate();

  const { cartItems, cartTotal, clearCart } = useCart();
  const { token, user, logout } = useAuth();
  const submissionInProgress = useRef(false);
  const checkoutIntentId = useRef(createCheckoutIntentId());

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [serverTotals, setServerTotals] = useState(null);
  const [serverOrderItems, setServerOrderItems] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingPrice =
    serverTotals?.shippingPrice ?? (cartTotal >= 1000 ? 0 : 100);

  const taxPrice = serverTotals?.taxPrice ?? Math.round(cartTotal * 0.18);

  const totalPrice =
    serverTotals?.totalPrice ?? cartTotal + shippingPrice + taxPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    checkoutIntentId.current = createCheckoutIntentId();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!token) {
      navigate("/login", {
        replace: true,
        state: { message: "Please log in again to continue payment." },
      });
      return;
    }

    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    let razorpayModalOpened = false;

    try {
      setLoading(true);
      setError("");

      const orderItems = cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      }));

      if (paymentMethod === "COD") {
        const response = await fetch("http://localhost:5000/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderItems,
            shippingAddress: formData,
            paymentMethod,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Order failed");

        clearCart();
        navigate(`/orders/${data._id}`);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderItems,
            shippingAddress: formData,
            checkoutIntentId: checkoutIntentId.current,
          }),
        },
      );
      const paymentOrder = await response.json();
      if (
        ["AUTH_TOKEN_INVALID", "AUTH_TOKEN_EXPIRED"].includes(paymentOrder.code)
      ) {
        logout();
        navigate("/login", {
          replace: true,
          state: {
            message:
              paymentOrder.message ||
              "Your session expired. Please log in again.",
          },
        });
        return;
      }
      if (!response.ok) {
        throw new Error(
          paymentOrder.message ||
            `Unable to start payment (HTTP ${response.status})`,
        );
      }
      if (paymentOrder.alreadyPaid && paymentOrder.order?._id) {
        clearCart();
        navigate(`/orders/${paymentOrder.order._id}`);
        return;
      }
      setServerTotals({
        itemsPrice: paymentOrder.itemsPrice,
        shippingPrice: paymentOrder.shippingPrice,
        taxPrice: paymentOrder.taxPrice,
        totalPrice: paymentOrder.totalPrice,
      });
      setServerOrderItems(paymentOrder.orderItems);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay checkout could not be loaded. Please try again.",
        );
      }

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "ShopCart",
        description: "E-commerce order payment",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: paymentOrder.customer?.name || user?.name || formData.fullName,
          email: paymentOrder.customer?.email || user?.email || "",
          contact: paymentOrder.customer?.contact || formData.phone,
        },
        theme: { color: "#1e3a5f" },
        modal: {
          ondismiss: () => {
            submissionInProgress.current = false;
            setLoading(false);
            setError("Payment was cancelled. Your cart has not been changed.");
          },
        },
        handler: async (paymentResult) => {
          setLoading(true);
          setError("");
          try {
            const verifyResponse = await fetch(
              "http://localhost:5000/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  paymentAttemptId: paymentOrder.paymentAttemptId,
                  razorpay_order_id: paymentResult.razorpay_order_id,
                  razorpay_payment_id: paymentResult.razorpay_payment_id,
                  razorpay_signature: paymentResult.razorpay_signature,
                }),
              },
            );
            const verification = await verifyResponse.json();
            if (
              ["AUTH_TOKEN_INVALID", "AUTH_TOKEN_EXPIRED"].includes(
                verification.code,
              )
            ) {
              logout();
              navigate("/login", {
                replace: true,
                state: {
                  message:
                    verification.message ||
                    "Your session expired. Please log in again.",
                },
              });
              return;
            }
            if (
              !verifyResponse.ok ||
              verification.success !== true ||
              !verification.order?._id
            ) {
              throw new Error(
                verification.message || "Payment verification failed",
              );
            }

            clearCart();
            navigate(`/orders/${verification.order._id}`);
          } catch (verificationError) {
            setError(
              verificationError.message ||
                "Payment could not be verified. Your cart has not been cleared.",
            );
          } finally {
            submissionInProgress.current = false;
            setLoading(false);
          }
        },
      });

      checkout.on("payment.failed", (event) => {
        submissionInProgress.current = false;
        setLoading(false);
        setError(
          event.error?.description ||
            "Payment failed. Your cart has not been changed; please try again.",
        );
      });
      checkout.open();
      razorpayModalOpened = true;
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      if (!razorpayModalOpened) {
        submissionInProgress.current = false;
        setLoading(false);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h1>Your Cart is Empty</h1>

        <button onClick={() => navigate("/products")}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-container">
        {/* Shipping Form */}

        <div className="checkout-form">
          <h2>Shipping Address</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="checkout-row">
              <div className="form-group">
                <label>City</label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State</label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="checkout-row">
              <div className="form-group">
                <label>Postal Code</label>

                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <h2>Payment Method</h2>

            <div className="payment-method">
              <label>
                <input
                  type="radio"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cash on Delivery
              </label>

              <label>
                <input
                  type="radio"
                  value="Razorpay"
                  checked={paymentMethod === "Razorpay"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Razorpay (UPI, cards, netbanking and more)
              </label>
            </div>

            {error && <p className="checkout-error">{error}</p>}

            <button
              type="submit"
              className="place-order-button"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : paymentMethod === "COD"
                  ? "Place Order"
                  : "Pay Now"}
            </button>
          </form>
        </div>

        {/* Order Summary */}

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {(serverOrderItems || cartItems).map((item) => (
            <div className="checkout-item" key={item.product || item._id}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <span>
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </span>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Items</span>

            <span>
              ₹{(serverTotals?.itemsPrice ?? cartTotal).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>

            <span>₹{shippingPrice.toLocaleString("en-IN")}</span>
          </div>

          <div className="summary-row">
            <span>Tax</span>

            <span>₹{taxPrice.toLocaleString("en-IN")}</span>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>

            <span>₹{totalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
