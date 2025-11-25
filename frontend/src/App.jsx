import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import { NotificationProvider } from "./pages/NotificationContext.jsx";
import Layout from "./pages/Layout.jsx";
import Products from "./pages/Products.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import AddressesPage from "./pages/AddAddressPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Registration from "./pages/Registration.jsx";
import ProductsAndServices from "./pages/ProductsAndServices.jsx";
import ContactMessage from "./pages/ContactMessage.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminCustomers from "./pages/AdminCustomers.jsx";
import AdminContactMessages from "./pages/AdminContactMessages.jsx";

// Axios interceptors
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          toastStyle={{
            backgroundColor: "#6a0dad",
            color: "#fff",
            fontWeight: "500",
            borderRadius: "12px",
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Public routes that handle their own protection */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/add-address" element={<AddressesPage />} />
          <Route path="/order-confirmation" element={<OrdersPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/signup" element={<Registration />} />
          <Route path="/products_services" element={<ProductsAndServices />} />
          <Route path="/contact" element={<AdminContactMessages />} />


          {/* Layout with public routes - individual pages protect themselves */}
          <Route path="/layout" element={<Layout />}>
  {/* Add this line for the dashboard */}
  <Route index element={<AdminDashboard />} />
  <Route path="products" element={<Products />} />
  <Route path="orders" element={<AdminOrders />} />
  <Route path="customers" element={<AdminCustomers />} />
  <Route path="contacts" element={<AdminContactMessages />} />
</Route>
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
