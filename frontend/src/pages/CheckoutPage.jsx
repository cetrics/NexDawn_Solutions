import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./css/CheckoutPage.css";
import Header from "./Header";

const CheckoutPage = () => {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isLoading, setIsLoading] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_type: "Home",
    contact_name: "",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    town: "",
    county: "",
    postal_code: "",
    country: "",
    is_default: false,
  });

  const navigate = useNavigate();

  // Helper function to decode JWT
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  // ✅ ADD THIS: Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to access checkout");
      navigate("/login");
      return;
    }
  }, [navigate]);

  if (token) {
    const decoded = parseJwt(token);
  }

  if (token) {
    const decoded = parseJwt(token);
  }

  useEffect(() => {
    if (!token) return;

    const decoded = parseJwt(token);
    if (decoded) {
      setUser(decoded); // store user info
      setMpesaPhone(decoded.phone || ""); // pre-fill phone
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = parseJwt(token);
    if (decoded) {
      setUser(decoded); // store user info in state
      if (decoded.phone) setMpesaPhone(decoded.phone); // pre-fill phone
    }
  }, []);

  // ✅ Load cart + fetch addresses from backend
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    const fetchAddresses = async () => {
      if (!token) return;

      try {
        const decoded = parseJwt(token);
        const userId = decoded.sub; // This is the user ID from JWT

        const res = await axios.get(`/api/addresses/${userId}`);
        const addresses = res.data.addresses || [];

        setAddresses(addresses);
        setSelectedAddress(addresses.find((addr) => addr.is_default) || null);
      } catch (err) {
        console.error("Error fetching addresses:", err);
        setAddresses([]);
      }
    };

    fetchAddresses();
  }, [token]);

  // ✅ Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  // ✅ Place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    // ✅ Normalize phone
    const formattedPhone = mpesaPhone.startsWith("254")
      ? mpesaPhone
      : "254" + mpesaPhone.replace(/^0+/, "");

    if (paymentMethod === "mpesa") {
      if (!mpesaPhone) {
        toast.error("Please enter your M-Pesa phone number");
        return;
      }

      setIsLoading(true);
      try {
        const res = await axios.post("/test-stkpush", {
          phone: formattedPhone,
          amount: total,
        });

        const checkout_id = res.data.checkout_id;
        toast.info("STK Push sent! Check your phone to complete payment.");

        // Poll for status
        const pollStatus = setInterval(async () => {
          const statusRes = await axios.get(`/check-status/${checkout_id}`);
          if (statusRes.data.status !== "Pending") {
            clearInterval(pollStatus);
            if (statusRes.data.status === "Success") {
              toast.success("Payment successful! Order confirmed.");

              // ✅ Save order to backend
              // ✅ Save order to backend
              try {
                const decoded = parseJwt(token);
                const userId = decoded.sub; // Use 'sub' from JWT token

                console.log("Creating order with data:", {
                  user_id: userId,
                  address_id: selectedAddress.address_id,
                  payment_method: paymentMethod,
                  total_amount: total,
                  cart_items: cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                });

                const orderResponse = await axios.post("/api/orders", {
                  user_id: userId, // Use the correct user ID from JWT
                  address_id: selectedAddress.address_id,
                  payment_method: paymentMethod,
                  total_amount: total,
                  cart_items: cart.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                });

                console.log("Order created successfully:", orderResponse.data);

                localStorage.removeItem("cart");
                navigate("/order-confirmation");
              } catch (err) {
                console.error("Failed to save order:", err);
                console.error("Error details:", err.response?.data);
                toast.error(
                  "Failed to save order: " +
                    (err.response?.data?.error || err.message)
                );
              }

              localStorage.removeItem("cart");
              navigate("/order-confirmation");
            } else {
              toast.error("Payment failed or cancelled.");
              setIsLoading(false);
            }
          }
        }, 5000);
      } catch (err) {
        console.error(err);
        toast.error("Failed to initiate STK Push");
        setIsLoading(false);
      }

      return; // skip normal order placement
    }

    // Fallback for credit card or COD
    setIsLoading(true);
    setTimeout(() => {
      toast.success("Order placed successfully!");
      localStorage.removeItem("cart");
      navigate("/order-confirmation");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div>
      <Header />
      <div className="checkout-container">
        <div className="checkout-left">
          {/* Delivery Address Section */}
          <div className="checkout-section">
            <h2>1. Delivery Address</h2>
            <div className="address-list">
              {addresses.length === 0 ? (
                <p className="no-address">
                  No saved addresses. Please add one.
                </p>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.address_id}
                    className={`address-card ${
                      selectedAddress?.address_id === address.address_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedAddress(address)}
                  >
                    <h3>
                      {address.address_type} {address.is_default && "(Default)"}
                    </h3>
                    <p>{address.address_line1}</p>
                    <p>
                      {address.town}, {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                    {selectedAddress?.address_id === address.address_id && (
                      <div className="selected-tick">✓</div>
                    )}
                  </div>
                ))
              )}
              <button
                className="add-address-btn"
                onClick={() => navigate("/add-address")}
              >
                + Add a new address
              </button>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="checkout-section">
            <h2>2. Payment Method</h2>
            <div className="payment-options">
              {/* ✅ Only Mpesa remains */}
              <label className="payment-method">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "mpesa"}
                  onChange={() => setPaymentMethod("mpesa")}
                />
                <span>M-Pesa</span>
              </label>

              {paymentMethod === "mpesa" && (
                <div className="payment-method-m">
                  <label>M-Pesa Phone Number</label>
                  <select className="country-code" value="254" disabled>
                    <option value="254">254</option>
                  </select>
                  <input
                    type="number"
                    value={mpesaPhone}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 10); // limit to 10 digits
                      setMpesaPhone(value);
                    }}
                    placeholder="7XXXXXXXX"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-right">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cart.length} items):</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax (16%):</span>
              <span>KES {tax.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>KES {total.toLocaleString()}</span>
            </div>
            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={isLoading || !selectedAddress}
            >
              {isLoading ? "Processing..." : "Place Your Order"}
            </button>
            <div className="secure-checkout">
              <span className="lock-icon">🔒</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
