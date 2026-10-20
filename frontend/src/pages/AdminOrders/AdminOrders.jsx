import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminOrders.css";

const AdminOrders = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://mern-ecommerce-fgzj.onrender.com/api/orders/admin/all",
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

  const updateStatus = async (orderId, orderStatus) => {
    try {
      setUpdatingId(orderId);

      const response = await fetch(
        `https://mern-ecommerce-fgzj.onrender.com/api/orders/admin/${orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            orderStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      // Update UI without refreshing
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? data : order)),
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="admin-orders-message">Loading orders...</div>;
  }

  if (error) {
    return <div className="admin-orders-message error">{error}</div>;
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <div>
          <h1>Admin Orders</h1>

          <p>
            Total Orders: <strong>{orders.length}</strong>
          </p>
        </div>

        <button onClick={fetchOrders} className="refresh-button">
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-admin-orders">
          <h2>No orders found</h2>
        </div>
      ) : (
        <div className="admin-orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Products</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Payment Status</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8)}</td>

                  <td>
                    <strong>{order.user?.name || "Unknown"}</strong>

                    <small>{order.user?.email || ""}</small>
                  </td>

                  <td>
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>

                  <td>
                    {order.orderItems.map((item) => (
                      <small key={item._id}>
                        {item.name} × {item.quantity}
                        <br />
                      </small>
                    ))}
                  </td>

                  <td>₹{order.totalPrice.toLocaleString("en-IN")}</td>

                  <td>
                    <span className="payment-badge">{order.paymentMethod}</span>
                  </td>

                  <td>{order.paymentStatus}</td>

                  <td>{order.razorpayPaymentId || "-"}</td>

                  <td>
                    <span
                      className={`admin-status ${order.orderStatus.toLowerCase()}`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>

                  <td>
                    <select
                      value={order.orderStatus}
                      disabled={updatingId === order._id}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                    >
                      <option value="Processing">Processing</option>

                      <option value="Shipped">Shipped</option>

                      <option value="Delivered">Delivered</option>

                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <Link
                      to={`/orders/${order._id}`}
                      className="admin-view-button"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
