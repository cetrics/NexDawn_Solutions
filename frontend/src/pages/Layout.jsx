import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaUsers,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaBars,
  FaSearch,
  FaShoppingCart,
  FaUserCircle,
} from "react-icons/fa";
import "./css/AdminLayout.css";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}
      >
        <div className="sidebar-header">
          <h2 className="logo-text">🛍️ NexDawn</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/layout" end>
            <FaHome /> Dashboard
          </NavLink>
          <NavLink to="/layout/products">
            <FaBox /> Products
          </NavLink>
          <NavLink to="/layout/orders">
            <FaShoppingCart /> Orders
          </NavLink>
          <NavLink to="/layout/customers">
            <FaUsers /> Customers
          </NavLink>
          <NavLink to="#">
            <FaChartBar /> Reports
          </NavLink>
          <NavLink to="#">
            <FaCog /> Settings
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
            <div className="search-bar">
              <FaSearch />
              <input type="text" placeholder="Search products, orders..." />
            </div>
          </div>

          <div className="header-right">
            <div className="header-icon-container">
              <FaBell className="header-icon" />
              <span className="badge">3</span>
            </div>
            <FaUserCircle className="header-icon user-icon" />
            <FaSignOutAlt
              className="header-icon logout-icon"
              title="Logout"
              onClick={handleLogout}
            />
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
