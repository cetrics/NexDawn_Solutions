import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./css/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/layout", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await axios.post("/api/login", {
      email,
      password,
    });

    if (response.data.success) {
      const user = response.data.user;

      // Save token and user
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on user type
      if (user.user_type === "admin") {
        navigate("/layout", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } else {
      setError(response.data.message || "Login failed");
    }
  } catch (err) {
    setError(err.response?.data?.message || "An error occurred during login");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="brand-logo">N</div>
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Sign in to your NexDawn account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="forgot-password-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        <div className="login-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
