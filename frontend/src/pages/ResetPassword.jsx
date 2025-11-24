import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import "./css/Login.css"; // Make sure this is imported for consistent styling

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/reset-password", { token, password });
      setIsError(false);
      setMessage(res.data.message || "Password reset successful!");
      setPassword(""); // ✅ Clear inputs after success
      setConfirmPassword("");
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-box">
          <h1>Invalid Link</h1>
          <p>Your reset link is invalid or has expired.</p>
          <Link to="/forgot-password" style={{ color: "#8b5cf6" }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>Reset Password</h1>

        {/* ✅ Green success / red error messages */}
        {message && (
          <div className={isError ? "login-error" : "login-success"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
