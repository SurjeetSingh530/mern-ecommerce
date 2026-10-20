import { createContext, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { token } = useAuth();

  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    if (!token) {
      setWishlist([]);
      return;
    }

    try {
      const response = await fetch("https://mern-ecommerce-fgzj.onrender.com/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to fetch wishlist");
        return;
      }

      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const addToWishlist = async (productId) => {
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch("https://mern-ecommerce-fgzj.onrender.com/api/wishlist", {
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
        alert(data.message || "Failed to add wishlist");
        return;
      }

      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Add wishlist error:", error);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch(
        `https://mern-ecommerce-fgzj.onrender.com/api/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to remove wishlist");
        return;
      }

      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Remove wishlist error:", error);
    }
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        addToWishlist,
        removeFromWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
};
