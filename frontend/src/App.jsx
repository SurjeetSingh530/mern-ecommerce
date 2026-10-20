import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Home from "./pages/Home/Home";
import Navbar from "./components/Navbar/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// ================= AUTH =================
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetOTP from "./pages/ResetOTP/ResetOTP";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

// ================= USER =================
import Profile from "./pages/Profile/Profile";

// ================= PRODUCTS =================
import Products from "./pages/Products/Products";
import ProductDetails from "./pages/ProductDetails/ProductDetails";

// ================= CART / CHECKOUT =================
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";

// ================= ORDERS =================
import Orders from "./pages/Orders/Orders";
import OrderDetails from "./pages/OrderDetails/OrderDetails";

// ================= ADMIN =================
import AdminOrders from "./pages/AdminOrders/AdminOrders";
import AdminProducts from "./pages/AdminProducts/AdminProducts";
import AddProduct from "./pages/AdminProducts/AddProduct";
import EditProduct from "./pages/AdminProducts/EditProduct";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

// ================= WISHLIST =================
import Wishlist from "./pages/Wishlist/Wishlist";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Navbar />

            <Routes>
              {/* ================= HOME ================= */}
              <Route path="/" element={<Home />} />

              {/* ================= PUBLIC ROUTES ================= */}

              {/* Register */}
              <Route path="/register" element={<Register />} />

              {/* Login */}
              <Route path="/login" element={<Login />} />

              {/* Email Verification OTP */}
              <Route path="/verify-email-otp" element={<VerifyOTP />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />

              {/* Forgot Password */}
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Password Reset OTP */}
              <Route path="/verify-reset-otp" element={<ResetOTP />} />

              {/* Reset Password */}
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Products */}
              <Route path="/products" element={<Products />} />

              {/* Product Details */}
              <Route path="/products/:id" element={<ProductDetails />} />

              {/* Cart */}
              <Route path="/cart" element={<Cart />} />

              {/* ================= PROTECTED ROUTES ================= */}

              <Route element={<ProtectedRoute />}>
                {/* Profile */}
                <Route path="/profile" element={<Profile />} />

                {/* Checkout */}
                <Route path="/checkout" element={<Checkout />} />

                {/* Orders */}
                <Route path="/orders" element={<Orders />} />

                {/* Order Details */}
                <Route path="/orders/:id" element={<OrderDetails />} />

                {/* ================= ADMIN ================= */}

                <Route path="/admin" element={<AdminDashboard />} />

                <Route path="/admin/orders" element={<AdminOrders />} />

                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/products/add" element={<AddProduct />} />
                  <Route
                    path="/admin/products/edit/:id"
                    element={<EditProduct />}
                  />
                </Route>

                {/* ================= WISHLIST ================= */}

                <Route path="/wishlist" element={<Wishlist />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
