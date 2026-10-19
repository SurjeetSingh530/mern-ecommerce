import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h1>Your Cart is Empty</h1>

        <Link to="/products">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      <div className="cart-container">
        {/* Cart Items */}

        <div className="cart-items">
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <img src={item.image} alt={item.name} />

              <div className="cart-info">
                <h2>{item.name}</h2>

                <p>₹{item.price.toLocaleString("en-IN")}</p>

                <div className="quantity">
                  <button onClick={() => decreaseQuantity(item._id)}>-</button>

                  <span>{item.quantity}</span>

                  <button onClick={() => increaseQuantity(item._id)}>+</button>
                </div>

                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <p>Items: {cartItems.length}</p>

          <h3>Total: ₹{cartTotal.toLocaleString("en-IN")}</h3>

          <button
            className="checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

          <button className="clear-button" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
