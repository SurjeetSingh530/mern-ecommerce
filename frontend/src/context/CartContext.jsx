import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];

      return Array.isArray(parsedCart)
        ? parsedCart.filter((item) => item && typeof item === "object")
        : [];
    } catch (error) {
      console.error("Failed to restore cart:", error);
      return [];
    }
  });

  // Save cart
  const saveCart = (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    setCartItems(safeItems);

    localStorage.setItem("cart", JSON.stringify(safeItems));
  };

  // Add product
  const addToCart = (product) => {
    const existingProduct = cartItems.find((item) => item._id === product._id);

    if (existingProduct) {
      const updatedCart = cartItems.map((item) =>
        item._id === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      );

      saveCart(updatedCart);
    } else {
      saveCart([
        ...cartItems,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  // Remove product
  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter((item) => item._id !== productId);

    saveCart(updatedCart);
  };

  // Increase quantity
  const increaseQuantity = (productId) => {
    const updatedCart = cartItems.map((item) =>
      item._id === productId
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item,
    );

    saveCart(updatedCart);
  };

  // Decrease quantity
  const decreaseQuantity = (productId) => {
    const updatedCart = cartItems
      .map((item) =>
        item._id === productId
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item,
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  // Clear cart
  const clearCart = () => {
    saveCart([]);
  };

  // Total items
  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  // Total price
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
