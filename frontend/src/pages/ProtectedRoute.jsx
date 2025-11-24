import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = () => {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        // Axios interceptor automatically adds the token now
        const res = await axios.get("/api/user-info");
        if (res.status === 200) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        console.error("Token invalid or expired:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsValid(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isValid === null) return null;
  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
