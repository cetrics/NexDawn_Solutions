import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaUsers,
  FaBell,
  FaSignOutAlt,
  FaBars,
  FaShoppingCart,
  FaUserCircle,
} from "react-icons/fa";
import axios from "axios";
import "./css/AdminLayout.css";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [newOrders, setNewOrders] = useState([]);
  const navigate = useNavigate();

  // Fetch new orders count
  const fetchNewOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/orders/new", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersWithNotification = response.data.orders; // Already filtered by backend

      setNewOrders(ordersWithNotification);
      setNotificationCount(response.data.count);
    } catch (error) {
      console.error("Error fetching new orders:", error);
    }
  };

  // Initial fetch and periodic polling
  useEffect(() => {
    fetchNewOrders();

    // Poll every 30 seconds for new orders
    const interval = setInterval(fetchNewOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleNotificationClick = async (order) => {
    try {
      const token = localStorage.getItem("token");

      // Clear the notification in the backend
      await axios.post(
        `/api/admin/orders/${order.order_number}/clear-notification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Navigate to the orders page with highlight query
      navigate(`/layout/orders?highlight=${order.order_number}`);

      // Close dropdown
      setShowNotificationDropdown(false);

      // Refresh notification count
      fetchNewOrders();
    } catch (error) {
      console.error("Error clearing notification:", error);
    }
  };

  const handleBellClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo-section">
            <img
              src="../static/img/nexdawn_logo.png"
              alt="NexDawn Solutions Logo"
              className="sidebar-logo"
            />
            {isSidebarOpen && (
              <div className="sidebar-brand-name">
                <h2>
                  NexDawn <span>Solutions</span>
                </h2>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/layout" end onClick={handleLinkClick}>
            <FaHome /> <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/layout/products" onClick={handleLinkClick}>
            <FaBox /> <span className="nav-text">Products</span>
          </NavLink>
          <NavLink to="/layout/orders" onClick={handleLinkClick}>
            <FaShoppingCart /> <span className="nav-text">Orders</span>
          </NavLink>
          <NavLink to="/layout/customers" onClick={handleLinkClick}>
            <FaUsers /> <span className="nav-text">Customers</span>
          </NavLink>
          <NavLink to="/layout/contacts" onClick={handleLinkClick}>
            <FaUsers /> <span className="nav-text">Contact Messages</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <FaBars
              className="menu-icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            {window.innerWidth <= 768 && (
              <span className="menu-text">Menu</span>
            )}
          </div>

          <div className="header-right">
            <div className="header-icon-container">
              <FaBell
                className="header-icon"
                onClick={handleBellClick}
                style={{ cursor: "pointer" }}
              />
              {notificationCount > 0 && (
                <span className="badge">{notificationCount}</span>
              )}

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>New Orders ({notificationCount})</h4>
                  </div>
                  <div className="notification-list">
                    {newOrders.length > 0 ? (
                      newOrders.map((order) => (
                        <div
                          key={order.order_number}
                          className="notification-item"
                          onClick={() => handleNotificationClick(order)}
                        >
                          <div className="notification-title">
                            Order #{order.order_number}
                          </div>
                          <div className="notification-subtitle">
                            {/* You can show user_id instead of name */}
                            User ID: {order.user_id}
                          </div>
                          <div className="notification-amount">
                            KES {order.total_amount?.toLocaleString()}
                          </div>
                          <div className="notification-time">Just now</div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">No new orders</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <FaUserCircle className="header-icon user-icon" />
            <FaSignOutAlt
              className="header-icon logout-icon"
              title="Logout"
              onClick={handleLogout}
            />
          </div>
        </header>

        {/* Add overlay for mobile when sidebar is open */}
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
