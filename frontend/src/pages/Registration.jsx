import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./css/Registration.css";
import { toast } from "react-toastify";
import Header from "./Header";
import Footer from "./Footer";

// Terms Modal Component
const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Terms and Conditions</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body terms-content">
          <div className="terms-section">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using NexDawn Solutions' services, you agree to
              be bound by these Terms and Conditions.
            </p>
          </div>

          <div className="terms-section">
            <h3>2. Account Registration</h3>
            <p>
              You must provide accurate and complete information when creating
              an account. You are responsible for maintaining the
              confidentiality of your account credentials.
            </p>
          </div>

          <div className="terms-section">
            <h3>3. Product Information</h3>
            <p>
              We strive for accuracy in product descriptions and pricing.
              However, we reserve the right to correct any errors and to change
              or update information at any time.
            </p>
          </div>

          <div className="terms-section">
            <h3>4. Pricing and Payments</h3>
            <p>
              All prices are in KES and include VAT where applicable. We accept
              various payment methods as displayed on our platform.
            </p>
          </div>

          <div className="terms-section">
            <h3>5. Shipping and Delivery</h3>
            <p>
              Delivery times are estimates and may vary. We are not responsible
              for delays caused by shipping carriers or unforeseen
              circumstances.
            </p>
          </div>

          <div className="terms-section">
            <h3>6. Returns and Refunds</h3>
            <p>
              Returns must be initiated within 14 days of receipt. Products must
              be in original condition with all packaging. Refunds will be
              processed within 7-10 business days.
            </p>
          </div>

          <div className="terms-section">
            <h3>7. Intellectual Property</h3>
            <p>
              All content on this platform is owned by NexDawn Solutions and
              protected by copyright laws.
            </p>
          </div>

          <div className="terms-section">
            <h3>8. Limitation of Liability</h3>
            <p>
              NexDawn Solutions shall not be liable for any indirect,
              incidental, or consequential damages arising from the use of our
              services.
            </p>
          </div>

          <div className="terms-section">
            <h3>9. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of Kenya.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

// Privacy Modal Component
const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Privacy Policy</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body privacy-content">
          <div className="privacy-section">
            <h3>1. Information We Collect</h3>
            <p>
              We collect personal information including name, email, phone
              number, shipping address, and payment information to process your
              orders and provide services.
            </p>
          </div>

          <div className="privacy-section">
            <h3>2. How We Use Your Information</h3>
            <p>
              Your information is used to process orders, communicate with you,
              improve our services, and comply with legal obligations.
            </p>
          </div>

          <div className="privacy-section">
            <h3>3. Data Protection</h3>
            <p>
              We implement security measures to protect your personal
              information against unauthorized access, alteration, or
              destruction.
            </p>
          </div>

          <div className="privacy-section">
            <h3>4. Third-Party Sharing</h3>
            <p>
              We may share your information with trusted third parties for order
              fulfillment, payment processing, and shipping. We never sell your
              personal data.
            </p>
          </div>

          <div className="privacy-section">
            <h3>5. Cookies and Tracking</h3>
            <p>
              We use cookies to enhance your browsing experience, analyze site
              traffic, and personalize content.
            </p>
          </div>

          <div className="privacy-section">
            <h3>6. Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal
              information. Contact us to exercise these rights.
            </p>
          </div>

          <div className="privacy-section">
            <h3>7. Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to
              fulfill the purposes outlined in this policy, unless a longer
              retention period is required by law.
            </p>
          </div>

          <div className="privacy-section">
            <h3>8. Children's Privacy</h3>
            <p>
              Our services are not directed to individuals under 18. We do not
              knowingly collect personal information from children.
            </p>
          </div>

          <div className="privacy-section">
            <h3>9. Policy Updates</h3>
            <p>
              We may update this Privacy Policy periodically. Continued use of
              our services constitutes acceptance of any changes.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

const Registration = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    idNumber: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("registration-page");
    return () => {
      document.body.classList.remove("registration-page");
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/layout", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username) {
      toast.error("Email, username, and password are required");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms and conditions");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("➡️ Sending registration request:", formData.email);

      const response = await axios.post("/api/register", {
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        id_number: formData.idNumber,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        password: formData.password,
      });

      console.log("✅ Registration response:", response.data);

      if (response.data.success) {
        // Show success toast and redirect to login
        toast.success("Registration successful! Please login.");
        navigate("/login", { replace: true });
      } else {
        toast.error(response.data.message || "Registration failed");
        console.warn("⚠️ Registration failed:", response.data.message);
      }
    } catch (err) {
      console.error(
        "❌ Registration error:",
        err.response?.data || err.message
      );
      toast.error(
        err.response?.data?.message || "An error occurred during registration"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="registration-container">
        <div className="registration-header">
          <h1 className="registration-title">Create Your Account</h1>
          <p className="registration-subtitle">Join NexDawn Solutions today</p>
        </div>

        <div className="registration-form">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                placeholder="Enter your first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                placeholder="Enter your last name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="Enter your ID number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Create a password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <label htmlFor="agreeToTerms">
                I agree to the{" "}
                <button
                  type="button"
                  className="terms-link"
                  onClick={() => setShowTermsModal(true)}
                >
                  Terms and Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="terms-link"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="registration-footer">
            <p>
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />

      {/* Modal Components */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};

export default Registration;
