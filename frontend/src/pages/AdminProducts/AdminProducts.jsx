import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminProducts.css";

const AdminProducts = () => {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/products");

      const data = await response.json();

      console.log("Products API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch products");
      }

      // Handle both:
      // 1. [product, product, ...]
      // 2. { products: [product, product, ...] }

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        throw new Error("Invalid products response from server");
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="admin-product-message">Loading products...</div>;
  }

  if (error) {
    return <div className="admin-product-message error">{error}</div>;
  }

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <div>
          <h1>Manage Products</h1>

          <p>
            Total Products: <strong>{products.length}</strong>
          </p>
        </div>

        <Link to="/admin/products/add" className="add-product-button">
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-product-message">No products found.</div>
      ) : (
        <div className="admin-products-grid">
          {products.map((product) => (
            <div className="admin-product-card" key={product._id}>
              <img src={product.image} alt={product.name} />

              <div className="admin-product-info">
                <h2>{product.name}</h2>

                <p>Brand: {product.brand}</p>

                <p>Category: {product.category}</p>

                <h3>₹{Number(product.price).toLocaleString("en-IN")}</h3>

                <p>
                  Stock: <strong>{product.stock}</strong>
                </p>

                <div className="admin-product-actions">
                  <Link
                    to={`/admin/products/edit/${product._id}`}
                    className="edit-button"
                  >
                    Edit
                  </Link>

                  <button
                    className="delete-button"
                    onClick={() => deleteProduct(product._id)}
                  >
                    Delete
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

export default AdminProducts;
