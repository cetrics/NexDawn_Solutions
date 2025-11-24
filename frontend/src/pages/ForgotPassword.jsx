import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./css/Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/forgot-password", { email });
      setIsError(false);
      setMessage(res.data.message || "Reset link sent!");
      setEmail(""); // ✅ clear input after success
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>Forgot Password</h1>
        <p>Enter your email below and we’ll send you a password reset link.</p>

        {/* ✅ Green for success, red for errors */}
        {message && (
          <div className={isError ? "login-error" : "login-success"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: "1rem" }}>
          <Link
            to="/login"
            style={{ color: "#8b5cf6", textDecoration: "none" }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
