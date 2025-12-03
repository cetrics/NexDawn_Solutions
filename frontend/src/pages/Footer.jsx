import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./css/Footer.css";

const Footer = () => {
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

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <p>📧 info@nexdawn.co.ke</p>
              <p>📞 +254731062205</p>
              <p>📍 Kutus, Kirinyaga, Kenya</p>
              <p>🕒 Mon-Sat: 8AM-5PM</p>
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
