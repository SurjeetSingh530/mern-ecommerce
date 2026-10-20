import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./OrderDetails.css";

const OrderDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    try {
      const response = await fetch(`https://mern-ecommerce-fgzj.onrender.com/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order not found");
      }

      setOrder(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchOrder();
    }
  }, [token, id]);

  if (loading) {
    return <div className="order-details-message">Loading order...</div>;
  }

  if (error) {
    return <div className="order-details-message error">{error}</div>;
  }

  if (!order) {
    return <div className="order-details-message">Order not found</div>;
  }

  return (
    <div className="order-details-page">
      <div className="order-details-title">
        <h1>Order Details</h1>

        <p>
          Order ID: <strong>#{order._id}</strong>
        </p>

        <p>Date: {new Date(order.createdAt).toLocaleString("en-IN")}</p>
      </div>

      {/* Order Status */}

      <div className="order-status-box">
        <h2>Order Status</h2>

        <span className={`details-status ${order.orderStatus.toLowerCase()}`}>
          {order.orderStatus}
        </span>
      </div>

      {/* Products */}

      <div className="details-section">
        <h2>Products</h2>

        {order.orderItems.map((item) => (
          <div className="details-product" key={item._id}>
            <img src={item.image} alt={item.name} />

            <div className="details-product-info">
              <h3>{item.name}</h3>

              <p>Quantity: {item.quantity}</p>

              <p>Price: ₹{item.price.toLocaleString("en-IN")}</p>
            </div>

            <strong>
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </strong>
          </div>
        ))}
      </div>

      {/* Shipping */}

      <div className="details-section">
        <h2>Shipping Address</h2>

        <p>
          <strong>{order.shippingAddress.fullName}</strong>
        </p>

        <p>{order.shippingAddress.address}</p>

        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state}
        </p>

        <p>PIN: {order.shippingAddress.postalCode}</p>

        <p>Phone: {order.shippingAddress.phone}</p>
      </div>

      {/* Payment */}

      <div className="details-section">
        <h2>Payment Information</h2>

        <p>
          Method: <strong>{order.paymentMethod}</strong>
        </p>

        <p>
          Payment Status: <strong>{order.paymentStatus}</strong>
        </p>

        {order.razorpayPaymentId && (
          <p>
            Payment ID: <strong>{order.razorpayPaymentId}</strong>
          </p>
        )}

        {order.paidAt && (
          <p>Paid: {new Date(order.paidAt).toLocaleString("en-IN")}</p>
        )}
      </div>

      {/* Summary */}

      <div className="details-summary">
        <h2>Order Summary</h2>

        <div>
          <span>Items Price</span>

          <span>₹{order.itemsPrice.toLocaleString("en-IN")}</span>
        </div>

        <div>
          <span>Shipping</span>

          <span>₹{order.shippingPrice.toLocaleString("en-IN")}</span>
        </div>

        <div>
          <span>Tax</span>

          <span>₹{order.taxPrice.toLocaleString("en-IN")}</span>
        </div>

        <hr />

        <div className="grand-total">
          <strong>Total</strong>

          <strong>₹{order.totalPrice.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <Link to="/orders" className="back-orders-button">
        ← Back to My Orders
      </Link>
    </div>
  );
};

export default OrderDetails;
