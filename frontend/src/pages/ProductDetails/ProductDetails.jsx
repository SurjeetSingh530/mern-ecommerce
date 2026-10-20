import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check wishlist only after product is loaded
  const isWishlisted = product
    ? wishlist.some((item) => item._id === product._id)
    : false;

  // Fetch single product
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`https://mern-ecommerce-fgzj.onrender.com/api/products/${id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Product not found");
      }

      setProduct(data);
    } catch (error) {
      console.error("Product error:", error);

      setError(error.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Increase quantity
  const increaseQuantity = () => {
    if (!product) return;

    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Decrease quantity
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!product) return;

    addToCart(product, quantity);
  };

  // Buy now
  const handleBuyNow = () => {
    if (!product) return;

    addToCart(product, quantity);

    navigate("/cart");
  };

  // Wishlist toggle
  const handleWishlist = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to manage your wishlist");
      navigate("/login");
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      alert(error.message || "Something went wrong");
    }
  };

  // Loading
  if (loading) {
    return <div className="details-message">Loading product...</div>;
  }

  // Error
  if (error) {
    return <div className="details-message error">{error}</div>;
  }

  // Product not found
  if (!product) {
    return <div className="details-message">Product not found</div>;
  }

  return (
    <div className="product-details">
      {/* PRODUCT IMAGE */}
      <div className="product-details-image">
        <img src={product.image} alt={product.name} />
      </div>

      {/* PRODUCT INFO */}
      <div className="product-details-info">
        <p className="details-brand">{product.brand}</p>

        <h1>{product.name}</h1>

        {/* RATING */}
        <div className="details-rating">
          ⭐ {product.rating || 0} / 5 ({product.numReviews || 0} reviews)
        </div>

        {/* PRICE */}
        <p className="details-price">
          ₹{Number(product.price).toLocaleString("en-IN")}
        </p>

        {/* DESCRIPTION */}
        <p className="details-description">{product.description}</p>

        {/* CATEGORY */}
        <p>
          Category: <strong>{product.category}</strong>
        </p>

        {/* STOCK */}
        <p className="details-stock">
          {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
        </p>

        {/* QUANTITY + BUTTONS */}
        {product.stock > 0 && (
          <>
            <div className="details-quantity">
              <span>Quantity:</span>

              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity === 1}
              >
                -
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>

            <div className="details-buttons">
              <button
                type="button"
                className="add-cart-button"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              <button
                type="button"
                className="buy-now-button"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
            </div>
          </>
        )}

        {/* WISHLIST */}
        <button
          type="button"
          className="wishlist-button"
          onClick={handleWishlist}
        >
          {isWishlisted ? "❤️ Remove Wishlist" : "🤍 Add to Wishlist"}
        </button>

        {/* BACK */}
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/products")}
        >
          ← Back to Products
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
