import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./css/AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: {
      total: 0,
      pending: 0,
      delivered: 0,
      revenue: 0,
    },
    customers: {
      total: 0,
      active: 0,
      withOrders: 0,
    },
    messages: {
      total: 0,
      today: 0,
      unread: 0,
    },
    products: {
      total: 0,
      lowStock: 0,
    },
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user || user.user_type !== "admin") {
    navigate("/login", { replace: true });
  }
}, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch all data in parallel
      const [
        ordersRes,
        customersRes,
        messagesRes,
        recentOrdersRes,
        recentMessagesRes,
      ] = await Promise.all([
        axios.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/admin/customers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/contact/messages", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/admin/orders?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/contact/messages?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Process statistics
      const orders = ordersRes.data;
      const customers = customersRes.data;
      const messages = messagesRes.data.messages || [];

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));

      setStats({
        orders: {
          total: orders.length,
          pending: orders.filter((o) => o.status === "pending").length,
          delivered: orders.filter((o) => o.status === "delivered").length,
          revenue: orders.reduce(
            (sum, order) => sum + (parseFloat(order.total_amount) || 0),
            0
          ),
        },
        customers: {
          total: customers.length,
          active: customers.filter((c) => c.last_login).length,
          withOrders: customers.filter((c) => (c.order_count || 0) > 0).length,
        },
        messages: {
          total: messages.length,
          today: messages.filter((m) => new Date(m.created_at) > todayStart)
            .length,
          unread: messages.filter((m) => !m.read).length, // Assuming you add a 'read' field
        },
        products: {
          total: 0, // You'll need to implement products endpoint
          lowStock: 0,
        },
      });

      // Set recent data
      setRecentOrders(recentOrdersRes.data.slice(0, 5));
      setRecentMessages((recentMessagesRes.data.messages || []).slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return "KES 0";
    }
    return `KES ${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "admin-status-pending",
      confirmed: "admin-status-confirmed",
      processing: "admin-status-processing",
      shipped: "admin-status-shipped",
      delivered: "admin-status-delivered",
      cancelled: "admin-status-cancelled",
    };
    return statusMap[status?.toLowerCase()] || "admin-status-pending";
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Dashboard Overview</h1>
        <p className="admin-dashboard-subtitle">
          Welcome to your admin dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Main Statistics Grid */}
      <div className="admin-dashboard-stats-grid">
        {/* Orders Card */}
        <div
          className="admin-stat-card admin-stat-card-large"
          onClick={() => navigate("/layout/orders")}
        >
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-title">Orders</h3>
            <div className="admin-stat-main">{stats.orders.total}</div>
            <div className="admin-stat-details">
              <span className="admin-stat-detail admin-stat-pending">
                {stats.orders.pending} pending
              </span>
              <span className="admin-stat-detail admin-stat-delivered">
                {stats.orders.delivered} delivered
              </span>
            </div>
          </div>
          <div className="admin-stat-revenue">
            {formatCurrency(stats.orders.revenue)}
          </div>
        </div>

        {/* Customers Card */}
        <div
          className="admin-stat-card"
          onClick={() => navigate("/layout/customers")}
        >
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-title">Customers</h3>
            <div className="admin-stat-main">{stats.customers.total}</div>
            <div className="admin-stat-details">
              <span className="admin-stat-detail">
                {stats.customers.active} active
              </span>
            </div>
          </div>
        </div>

        {/* Messages Card */}
        <div
          className="admin-stat-card"
          onClick={() => navigate("/layout/contacts")}
        >
          <div className="admin-stat-icon">✉️</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-title">Messages</h3>
            <div className="admin-stat-main">{stats.messages.total}</div>
            <div className="admin-stat-details">
              <span className="admin-stat-detail">
                {stats.messages.today} today
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="admin-stat-card admin-stat-card-highlight">
          <div className="admin-stat-icon">💰</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-title">Total Revenue</h3>
            <div className="admin-stat-main">
              {formatCurrency(stats.orders.revenue)}
            </div>
            <div className="admin-stat-details">
              <span className="admin-stat-detail">All time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="admin-dashboard-content">
        {/* Recent Orders */}
        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Orders</h2>
            <button
              className="admin-btn-view-all"
              onClick={() => navigate("/layout/orders")}
            >
              View All
            </button>
          </div>
          <div className="admin-section-content">
            {recentOrders.length === 0 ? (
              <div className="admin-no-data">No recent orders</div>
            ) : (
              <div className="admin-orders-list">
                {recentOrders.map((order) => (
                  <div key={order.order_number} className="admin-order-item">
                    <div className="admin-order-info">
                      <div className="admin-order-number">
                        #{order.order_number}
                      </div>
                      <div className="admin-order-customer">
                        {order.user_email}
                      </div>
                      <div className="admin-order-amount">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </div>
                    <div className="admin-order-meta">
                      <span
                        className={`admin-status-badge ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span className="admin-order-date">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Messages</h2>
            <button
              className="admin-btn-view-all"
              onClick={() => navigate("/layout/contacts")}
            >
              View All
            </button>
          </div>
          <div className="admin-section-content">
            {recentMessages.length === 0 ? (
              <div className="admin-no-data">No recent messages</div>
            ) : (
              <div className="admin-messages-list">
                {recentMessages.map((message) => (
                  <div key={message.id} className="admin-message-item">
                    <div className="admin-message-sender">
                      <div className="admin-sender-name">{message.name}</div>
                      <div className="admin-sender-email">{message.email}</div>
                    </div>
                    <div className="admin-message-preview">
                      {message.message.length > 80
                        ? `${message.message.substring(0, 80)}...`
                        : message.message}
                    </div>
                    <div className="admin-message-date">
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Quick Actions</h2>
          </div>
          <div className="admin-section-content">
            <div className="admin-quick-actions-grid">
              <button
                className="admin-quick-action-btn"
                onClick={() => navigate("/layout/orders")}
              >
                <span className="admin-action-icon">📦</span>
                <span className="admin-action-text">Manage Orders</span>
              </button>
              <button
                className="admin-quick-action-btn"
                onClick={() => navigate("/layout/customers")}
              >
                <span className="admin-action-icon">👥</span>
                <span className="admin-action-text">View Customers</span>
              </button>
              <button
                className="admin-quick-action-btn"
                onClick={() => navigate("/layout/contacts")}
              >
                <span className="admin-action-icon">✉️</span>
                <span className="admin-action-text">Check Messages</span>
              </button>
              <button
                className="admin-quick-action-btn"
                onClick={() => navigate("/layout/products")}
              >
                <span className="admin-action-icon">🛍️</span>
                <span className="admin-action-text">Manage Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="admin-dashboard-footer">
        <div className="admin-system-status">
          <div className="admin-status-item admin-status-online">
            <span className="admin-status-dot"></span>
            System Online
          </div>
          <div className="admin-status-item">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;