// Header.js
import React from "react";
import "./css/Home.css"; // You might want to create a separate CSS file

const Header = () => {
  return (
    <>
      {/* Banner / Header */}
      <div className="home-promo-banner">
        Get Wells Fargo Sponsored Financing! Buy Now, Pay Later from 3 to 60
        months
      </div>

      {/* Navigation Bar */}
      <header className="home-header">
        <div className="home-logo-section">
          <img
            src="../static/img/nexdawn_logo.jpg"
            alt="NexDawn Solutions Logo"
            className="home-logo"
          />
          <div className="home-brand-name">
            <h1>
              NexDawn <span>Solutions</span>
            </h1>
          </div>
        </div>

        <nav className="home-nav-links">
          <a href="#">Home</a>
          <a href="#">Computers</a>
          <a href="#">Accessories</a>
          <a href="#">Stationery</a>
        </nav>

        <div className="home-header-actions">
          <a href="#" className="icon">
            Wishlist
          </a>
          <a href="/cart" className="icon">
            Cart
          </a>
          <a href="#" className="icon">
            Account
          </a>
        </div>
      </header>
    </>
  );
};

export default Header;
