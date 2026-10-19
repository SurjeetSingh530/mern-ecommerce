import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch stats");
      }

      setStats(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return <div className="dashboard-message">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-message error">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, Admin</p>
        </div>

        <button onClick={fetchStats} className="refresh-dashboard">
          Refresh
        </button>
      </div>

      {/* Statistics */}

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Users</p>
          <h2>{stats.totalUsers}</h2>
        </div>

        <div className="stat-card">
          <p>Total Products</p>
          <h2>{stats.totalProducts}</h2>
        </div>

        <div className="stat-card">
          <p>Total Orders</p>
          <h2>{stats.totalOrders}</h2>
        </div>

        <div className="stat-card">
          <p>Total Revenue</p>
          <h2>₹{stats.totalRevenue.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {/* Order Statistics */}

      <div className="order-stats">
        <div className="order-stat-card">
          <p>Processing Orders</p>

          <h2>{stats.pendingOrders}</h2>

          <Link to="/admin/orders">View Orders →</Link>
        </div>

        <div className="order-stat-card">
          <p>Delivered Orders</p>

          <h2>{stats.deliveredOrders}</h2>

          <Link to="/admin/orders">View Orders →</Link>
        </div>
      </div>

      {/* Admin Actions */}

      <div className="admin-actions">
        <h2>Quick Actions</h2>

        <div className="action-grid">
          <Link to="/admin/products" className="action-card">
            <h3>Manage Products</h3>
            <p>Add, edit and delete products</p>
          </Link>

          <Link to="/admin/products/add" className="action-card">
            <h3>Add Product</h3>
            <p>Create a new product</p>
          </Link>

          <Link to="/admin/orders" className="action-card">
            <h3>Manage Orders</h3>
            <p>View and update orders</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
