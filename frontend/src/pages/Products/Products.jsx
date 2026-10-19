import { useEffect, useState } from "react";

import "./Products.css";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const Products = () => {
  const { addToCart } = useCart();
  const { token } = useAuth();

  // ===============================
  // PRODUCTS
  // ===============================

  const [products, setProducts] = useState([]);

  // ===============================
  // SEARCH
  // ===============================

  const [search, setSearch] = useState("");

  // ===============================
  // CATEGORY
  // ===============================

  const [category, setCategory] = useState("All");

  // ===============================
  // SORT
  // ===============================

  const [sort, setSort] = useState("newest");

  // ===============================
  // PAGINATION
  // ===============================

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // ===============================
  // LOADING / ERROR
  // ===============================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // FETCH PRODUCTS
  // ===============================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // Create query parameters
      const params = new URLSearchParams();

      // Search
      if (search.trim()) {
        params.append("search", search);
      }

      // Category
      if (category !== "All") {
        params.append("category", category);
      }

      // Sort
      params.append("sort", sort);

      // Page
      params.append("page", page);

      // Products per page
      params.append("limit", 8);

      // API
      const response = await fetch(
        `http://localhost:5000/api/products?${params.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch products");
      }

      // Backend response:
      // {
      //   products: [],
      //   currentPage: 1,
      //   totalPages: 3,
      //   totalProducts: 20
      // }

      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ADD TO WISHLIST
  // ===============================

  const addToWishlist = async (productId) => {
    // User login check
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/wishlist", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add product to wishlist");

        return;
      }

      alert("❤️ Product added to Wishlist");
    } catch (error) {
      console.error(error);

      alert("Something went wrong while adding to wishlist");
    }
  };

  // ===============================
  // FETCH WHEN FILTER CHANGES
  // ===============================

  useEffect(() => {
    fetchProducts();
  }, [search, category, sort, page]);

  // ===============================
  // SEARCH
  // ===============================

  const handleSearch = (e) => {
    setSearch(e.target.value);

    // Search ke baad page 1
    setPage(1);
  };

  // ===============================
  // CATEGORY
  // ===============================

  const handleCategory = (e) => {
    setCategory(e.target.value);

    // Category change ke baad page 1
    setPage(1);
  };

  // ===============================
  // SORT
  // ===============================

  const handleSort = (e) => {
    setSort(e.target.value);

    // Sort change ke baad page 1
    setPage(1);
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return <div className="products-message">Loading products...</div>;
  }

  // ===============================
  // ERROR
  // ===============================

  if (error) {
    return <div className="products-message error">{error}</div>;
  }

  return (
    <div className="products-page">
      {/* =================================
          HEADER
      ================================= */}

      <div className="products-header">
        <div>
          <h1>Our Products</h1>

          <p>{totalProducts} products found</p>
        </div>
      </div>

      {/* =================================
          FILTERS
      ================================= */}

      <div className="product-filters">
        {/* SEARCH */}

        <input
          type="text"
          className="product-search"
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
        />

        {/* CATEGORY */}

        <select value={category} onChange={handleCategory}>
          <option value="All">All Categories</option>

          <option value="Electronics">Electronics</option>

          <option value="Clothing">Clothing</option>

          <option value="Shoes">Shoes</option>

          <option value="Beauty">Beauty</option>
        </select>

        {/* SORT */}

        <select value={sort} onChange={handleSort}>
          <option value="newest">Newest</option>

          <option value="oldest">Oldest</option>

          <option value="price-low">Price: Low to High</option>

          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* =================================
          PRODUCTS
      ================================= */}

      {products.length === 0 ? (
        <div className="no-products">
          <h2>No Products Found</h2>

          <p>Try another search or category.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div className="product-card" key={product._id}>
              {/* IMAGE */}

              <img src={product.image} alt={product.name} />

              {/* PRODUCT INFO */}

              <div className="product-info">
                <h2>{product.name}</h2>

                <p className="brand">{product.brand}</p>

                <p className="description">{product.description}</p>

                <p className="rating">⭐ {product.rating || 0}</p>

                <p className="price">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>

                <p className="stock">Stock: {product.stock}</p>

                {/* =================================
                    ACTIONS
                ================================= */}

                <div className="product-actions">
                  {/* WISHLIST */}

                  <button
                    className="wishlist-button"
                    onClick={() => addToWishlist(product._id)}
                  >
                    ❤️ Wishlist
                  </button>

                  {/* CART */}

                  <button
                    className="cart-button"
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? "🛒 Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================
          PAGINATION
      ================================= */}

      {totalPages > 1 && (
        <div className="pagination">
          {/* PREVIOUS */}

          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>

          {/* PAGE NUMBERS */}

          {Array.from(
            {
              length: totalPages,
            },
            (_, index) => index + 1,
          ).map((pageNumber) => (
            <button
              key={pageNumber}
              className={page === pageNumber ? "active-page" : ""}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}

          {/* NEXT */}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
