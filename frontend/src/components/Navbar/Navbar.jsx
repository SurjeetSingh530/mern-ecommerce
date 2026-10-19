import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";
import { useCart } from "../../context/CartContext";
<Link to="/wishlist" className="nav-link">
  ❤️ Wishlist
</Link>;
import { useWishlist } from "../../context/WishlistContext";

const Navbar = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const { cartCount } = useCart();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const { wishlistCount } = useWishlist();
  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        ShopCart
      </Link>

      {/* Navigation */}
      <div className="navbar-links">
        <Link to="/">Home</Link>

        <Link to="/products">Products</Link>

        {isLoggedIn && <Link to="/orders">My Orders</Link>}

        <Link to="/cart">Cart ({cartCount})</Link>

        <Link to="/admin">Dashboard</Link>

        <Link to="/wishlist">
          ❤️ Wishlist
          {wishlistCount > 0 && (
            <span className="wishlist-count">{wishlistCount}</span>
          )}
        </Link>

        <Link to="/admin/products">Products</Link>

        <Link to="/admin/orders">Orders</Link>

        {user?.role === "admin" && (
          <Link to="/admin/products">Admin Products</Link>
        )}

        {isLoggedIn ? (
          <>
            <Link to="/profile">{user?.name}</Link>

            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
