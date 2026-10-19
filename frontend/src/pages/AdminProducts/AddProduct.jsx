import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ProductForm.css";

const AddProduct = () => {
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

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      alert("Please select product image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", form.name);

      formData.append("description", form.description);

      formData.append("price", form.price);

      formData.append("category", form.category);

      formData.append("brand", form.brand);

      formData.append("stock", form.stock);

      // Important
      formData.append("image", image);

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      alert("Product added successfully");

      navigate("/admin/products");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-page">
      <h1>Add Product</h1>

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

        <label>Product Image</label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          required
        />

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Product Preview" />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
