import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // GET PROFILE
  const fetchProfile = async () => {
    try {
      const response = await fetch("https://mern-ecommerce-fgzj.onrender.com/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("SERVER RESPONSE:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message);
      }

      setProfile(data);

      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });

      setPreview(data.profileImage || "");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // INPUT CHANGE
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // IMAGE CHANGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);

    setPreview(URL.createObjectURL(file));
  };

  // UPDATE PROFILE
  // UPDATE PROFILE
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("pincode", form.pincode);

      if (image) {
        formData.append("profileImage", image);
      }

      const response = await fetch("https://mern-ecommerce-fgzj.onrender.com/api/users/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // First read response as text
      const text = await response.text();

      console.log("UPDATE RESPONSE:", text);
      console.log("STATUS:", response.status);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      setProfile(data.user);
      setPreview(data.user.profileImage || "");
      setImage(null);

      alert("Profile updated successfully");
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>

        {/* IMAGE */}

        <div className="profile-image-section">
          <img
            src={preview || "https://via.placeholder.com/150"}
            alt="Profile"
            className="profile-image"
          />

          <label htmlFor="profileImage" className="image-upload-button">
            Change Photo
          </label>

          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="profile-form">
          <label>Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>

          <input type="email" value={profile?.email || ""} disabled />

          <label>Phone</label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <label>Address</label>

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
          />

          <label>City</label>

          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
          />

          <label>State</label>

          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
          />

          <label>Pincode</label>

          <input
            type="text"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
