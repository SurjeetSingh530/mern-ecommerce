import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./Wishlist.css";

const Wishlist = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  // Get wishlist
  const fetchWishlist = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load wishlist");
      }

      setWishlist(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWishlist();
    }
  }, [token]);

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove product");
      }

      setWishlist(data);
    } catch (error) {
      alert(error.message);
    }
  };

  // Buy / Proceed to Checkout
  const proceedToCheckout = (product) => {
    addToCart(product);

    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <h2>Loading wishlist...</h2>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <h2>Your wishlist is empty ❤️</h2>

          <button onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div className="wishlist-card" key={product._id}>
              <img src={product.image} alt={product.name} />

              <div className="wishlist-info">
                <h2>{product.name}</h2>

                <p className="wishlist-price">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <p>Stock: {product.stock}</p>

                <div className="wishlist-actions">
                  {/* Proceed to Checkout */}
                  <button
                    className="checkout-button"
                    onClick={() => proceedToCheckout(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : "Proceed to Checkout"}
                  </button>

                  {/* Remove */}
                  <button
                    className="remove-button"
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
