import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Orders.css";

const Orders = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "https://mern-ecommerce-fgzj.onrender.com/api/orders/myorders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  if (loading) {
    return <div className="orders-message">Loading orders...</div>;
  }

  if (error) {
    return <div className="orders-message error">{error}</div>;
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h2>No orders found</h2>

          <Link to="/products">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-header">
                <div>
                  <p>Order ID</p>

                  <strong>#{order._id.slice(-8)}</strong>
                </div>

                <div>
                  <p>Date</p>

                  <strong>
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </strong>
                </div>

                <div>
                  <p>Status</p>

                  <strong
                    className={`status ${order.orderStatus.toLowerCase()}`}
                  >
                    {order.orderStatus}
                  </strong>
                </div>
              </div>

              <div className="order-body">
                <div>
                  <p>
                    Items:{" "}
                    {order.orderItems.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    )}
                  </p>

                  <p>Payment: {order.paymentMethod}</p>
                  <p>Payment Status: {order.paymentStatus}</p>

                  <h3>Total: ₹{order.totalPrice.toLocaleString("en-IN")}</h3>
                </div>

                <Link to={`/orders/${order._id}`} className="view-order-button">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
