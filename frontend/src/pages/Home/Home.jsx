
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API = "https://mern-ecommerce-fgzj.onrender.com/api/products";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API);
        if (!response.ok) throw new Error("Products load nahi hue");

        const data = await response.json();
        setProducts(
          Array.isArray(data) ? data : (data.products || [])
        );
      } catch (error) {
        console.error("Home products error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-tag">YOUR EVERYDAY SHOPPING DESTINATION</span>
          <h1>
            Welcome to <span>ShopKart</span>
          </h1>
          <p>
            Discover amazing products, explore new favorites,
            and enjoy shopping from the comfort of your home.
          </p>
          <Link to="/products" className="hero-button">
            Shop Now <span>→</span>
          </Link>
        </div>

        <div className="hero-decoration" aria-hidden="true">
          <div className="hero-circle">🛍️</div>
          <span className="float-item float-one">✨</span>
          <span className="float-item float-two">🎁</span>
        </div>
      </section>

      <section className="home-products">
        <div className="home-section-heading">
          <div>
            <span className="section-eyebrow">HANDPICKED FOR YOU</span>
            <h2>Explore Our Products</h2>
            <p>Find something you'll love.</p>
          </div>
          <Link to="/products" className="view-all">
            View All →
          </Link>
        </div>

        {loading ? (
          <p className="home-message">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="home-message">
            Products abhi load nahi ho paaye.
            <br />
            <Link to="/products">View Products Page →</Link>
          </div>
        ) : (
          <div className="home-product-grid">
            {products.slice(0, 8).map((product) => (
              <Link
                to={`/products/${product._id}`}
                className="home-product-card"
                key={product._id}
              >
                <div className="home-product-image">
                  {product.image || product.images?.[0] ? (
                    <img
                      src={
                        product.image ||
                        product.images?.[0]?.url ||
                        product.images?.[0]
                      }
                      alt={product.name || product.title || "Product"}
                    />
                  ) : (
                    <div className="product-placeholder">🛍️</div>
                  )}
                </div>
                <div className="home-product-info">
                  <h3>{product.name || product.title || "Product"}</h3>
                  <p className="home-product-price">
                    ₹{Number(product.price || 0).toLocaleString("en-IN")}
                  </p>
                  <span className="product-view-link">View Product →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="home-bottom-cta">    
          <Link to="/products" className="hero-button">
            Discover All Products →
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
