import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./css/Registration.css";
import { toast } from "react-toastify";
import Header from "./Header";
import Footer from "./Footer";

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
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
  // Remove: setError("");

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
    console.error("❌ Registration error:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "An error occurred during registration");
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
              <option value="other">Other</option>
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
              I agree to the <Link to="/terms">Terms and Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="registration-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
     <Footer />
    </div>
  );
};

export default Registration;