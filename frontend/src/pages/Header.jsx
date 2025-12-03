import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Home.css";
import UniversalSearch from "./UniversalSearch";
const Header = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const cartItemCount = cart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );
  const wishlistItemCount = wishlist.length;

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    localStorage.removeItem("wishlist");
    navigate("/login");
    setShowAccountDropdown(false);
  };

  const handleOrdersClick = () => {
    navigate("/order-confirmation");
    setShowAccountDropdown(false);
  };

  const handleAccountClick = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const handleWishlistClick = () => {
    navigate("/wishlist");
  };

  const isLoggedIn = localStorage.getItem("token");

  return (
    <>
      {/* Banner / Header */}
      <div className="home-promo-banner">
        Why pay more? Grab computers & stationery at shockingly low prices!
      </div>

      {/* Navigation Bar */}
      <header className="home-header">
        <div className="home-logo-section">
          <a href="/">
            <img
              src="../static/img/nexdawn_logo.png"
              alt="NexDawn Solutions Logo"
              className="home-logo"
            />
          </a>
          <div className="home-brand-name">
            <h1>
              NexDawn <span>Solutions</span>
            </h1>
          </div>
        </div>

        {/* Amazon-style Search Bar */}
        <div className="home-search-container">
          <UniversalSearch />
        </div>

        <div className="home-header-actions">
          <button className="icon wishlist-icon" onClick={handleWishlistClick}>
            <span className="icon-heart">❤️</span>
            Wishlist
            {wishlistItemCount > 0 && (
              <span className="wishlist-count-badge">{wishlistItemCount}</span>
            )}
          </button>
          <a href="/cart" className="icon cart-icon">
            <span className="icon-cart">🛒</span>
            Cart
            {cartItemCount > 0 && (
              <span className="cart-count-badge">{cartItemCount}</span>
            )}
          </a>
          <div className="account-dropdown" ref={dropdownRef}>
            <button className="icon account-icon" onClick={handleAccountClick}>
              <span className="icon-account">👤</span>
              Account
            </button>
            {showAccountDropdown && (
              <div className="dropdown-menu">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={handleOrdersClick}
                      className="dropdown-item"
                    >
                      📦 Orders
                    </button>
                    <button onClick={handleLogout} className="dropdown-item">
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="dropdown-item"
                  >
                    🔐 Login
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
