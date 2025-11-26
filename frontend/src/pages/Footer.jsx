import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./css/Footer.css";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories/with-products");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo-section">
              <img
                src="../static/img/nexdawn_logo2.png"
                alt="NexDawn Solutions Logo"
                className="footer-logo"
              />
              <div className="footer-brand-name">
                <h3>
                  NexDawn <span>Solutions</span>
                </h3>
              </div>
            </div>
            <p className="footer-description">
              Bringing Technology & Productivity Together. Your trusted partner
              for computers, accessories, and stationery solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">All Products</Link>
              </li>
              <li>
                <Link to="/products_services">Products & Services</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

         {/* Categories */}
<div className="footer-section">
  <h4>Categories</h4>
  {loading ? (
    <div className="categories-loading">
      <p>Loading categories...</p>
    </div>
  ) : categories.length > 0 ? (
    <ul className="footer-links">
      {categories.map((category) => (
        <li key={category.id}>
          <Link to={`/?scrollTo=${encodeURIComponent(category.name)}`}>
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <div className="no-categories">
      <p>No categories available</p>
    </div>
  )}
</div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <p>📧 support@nexdawn.com</p>
              <p>📞 +1 (555) 123-4567</p>
              <p>📍 123 Tech Street, Nairobi, Kenya</p>
              <p>🕒 Mon-Fri: 9AM-6PM</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2025 NexDawn Solutions. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;