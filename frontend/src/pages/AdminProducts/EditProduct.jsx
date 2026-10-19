import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "./ProductForm.css";

const EditProduct = () => {
  const { id } = useParams();

  const { token } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    stock: "",
  });

  const [currentImage, setCurrentImage] = useState("");

  const [newImage, setNewImage] = useState(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // =========================
  // GET PRODUCT
  // =========================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/products/${id}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Product not found");
        }

        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price || "",
          category: data.category || "",
          brand: data.brand || "",
          stock: data.stock || "",
        });

        setCurrentImage(data.image || "");
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // =========================
  // CHANGE INPUT
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // CHANGE IMAGE
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setNewImage(file);

    setPreview(URL.createObjectURL(file));
  };

  // =========================
  // UPDATE PRODUCT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", form.name);

      formData.append("description", form.description);

      formData.append("price", form.price);

      formData.append("category", form.category);

      formData.append("brand", form.brand);

      formData.append("stock", form.stock);

      // Only send new image
      if (newImage) {
        formData.append("image", newImage);
      }

      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      alert("Product updated successfully");

      navigate("/admin/products");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="product-form-page">Loading product...</div>;
  }

  return (
    <div className="product-form-page">
      <h1>Edit Product</h1>

      <form className="product-form" onSubmit={handleSubmit}>
        <label>Product Name</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Description</label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <label>Price</label>

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Category</label>

        <input
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        />

        <label>Brand</label>

        <input
          type="text"
          name="brand"
          value={form.brand}
          onChange={handleChange}
          required
        />

        <label>Stock</label>

        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Current Image</label>

        {currentImage && (
          <div className="image-preview">
            <img src={currentImage} alt={form.name} />
          </div>
        )}

        <label>Change Image</label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />

        {preview && (
          <div className="image-preview">
            <p>New Image Preview</p>

            <img src={preview} alt="New Product" />
          </div>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
