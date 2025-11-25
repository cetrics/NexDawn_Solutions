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
      revenue: 0
    },
    customers: {
      total: 0,
      active: 0,
      withOrders: 0
    },
    messages: {
      total: 0,
      today: 0,
      unread: 0
    },
    products: {
      total: 0,
      lowStock: 0
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch all data in parallel
      const [ordersRes, customersRes, messagesRes, recentOrdersRes, recentMessagesRes] = await Promise.all([
        axios.get("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/contact/messages", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/orders?limit=5", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/contact/messages?limit=5", { headers: { Authorization: `Bearer ${token}` } })
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
          pending: orders.filter(o => o.status === 'pending').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        },
        customers: {
          total: customers.length,
          active: customers.filter(c => c.last_login).length,
          withOrders: customers.filter(c => (c.order_count || 0) > 0).length
        },
        messages: {
          total: messages.length,
          today: messages.filter(m => new Date(m.created_at) > todayStart).length,
          unread: messages.filter(m => !m.read).length // Assuming you add a 'read' field
        },
        products: {
          total: 0, // You'll need to implement products endpoint
          lowStock: 0
        }
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
    return `KES ${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      confirmed: "status-confirmed",
      processing: "status-processing",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    return statusMap[status?.toLowerCase()] || "status-pending";
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome to your admin dashboard. Here's what's happening today.</p>
      </div>

      {/* Main Statistics Grid */}
      <div className="dashboard-stats-grid">
        {/* Orders Card */}
        <div className="stat-card large" onClick={() => navigate("/admin/orders")}>
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Orders</h3>
            <div className="stat-main">{stats.orders.total}</div>
            <div className="stat-details">
              <span className="stat-detail pending">{stats.orders.pending} pending</span>
              <span className="stat-detail delivered">{stats.orders.delivered} delivered</span>
            </div>
          </div>
          <div className="stat-revenue">{formatCurrency(stats.orders.revenue)}</div>
        </div>

        {/* Customers Card */}
        <div className="stat-card" onClick={() => navigate("/admin/customers")}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Customers</h3>
            <div className="stat-main">{stats.customers.total}</div>
            <div className="stat-details">
              <span className="stat-detail">{stats.customers.active} active</span>
            </div>
          </div>
        </div>

        {/* Messages Card */}
        <div className="stat-card" onClick={() => navigate("/admin/messages")}>
          <div className="stat-icon">✉️</div>
          <div className="stat-content">
            <h3>Messages</h3>
            <div className="stat-main">{stats.messages.total}</div>
            <div className="stat-details">
              <span className="stat-detail">{stats.messages.today} today</span>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <div className="stat-main">{formatCurrency(stats.orders.revenue)}</div>
            <div className="stat-details">
              <span className="stat-detail">All time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="dashboard-content">
        {/* Recent Orders */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button 
              className="btn-view-all"
              onClick={() => navigate("/admin/orders")}
            >
              View All
            </button>
          </div>
          <div className="section-content">
            {recentOrders.length === 0 ? (
              <div className="no-data">No recent orders</div>
            ) : (
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.order_number} className="order-item">
                    <div className="order-info">
                      <div className="order-number">#{order.order_number}</div>
                      <div className="order-customer">{order.user_email}</div>
                      <div className="order-amount">{formatCurrency(order.total_amount)}</div>
                    </div>
                    <div className="order-meta">
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Messages</h2>
            <button 
              className="btn-view-all"
              onClick={() => navigate("/admin/messages")}
            >
              View All
            </button>
          </div>
          <div className="section-content">
            {recentMessages.length === 0 ? (
              <div className="no-data">No recent messages</div>
            ) : (
              <div className="messages-list">
                {recentMessages.map((message) => (
                  <div key={message.id} className="message-item">
                    <div className="message-sender">
                      <div className="sender-name">{message.name}</div>
                      <div className="sender-email">{message.email}</div>
                    </div>
                    <div className="message-preview">
                      {message.message.length > 80 
                        ? `${message.message.substring(0, 80)}...`
                        : message.message
                      }
                    </div>
                    <div className="message-date">{formatDate(message.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="section-content">
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn"
                onClick={() => navigate("/admin/orders")}
              >
                <span className="action-icon">📦</span>
                <span className="action-text">Manage Orders</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate("/admin/customers")}
              >
                <span className="action-icon">👥</span>
                <span className="action-text">View Customers</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate("/admin/messages")}
              >
                <span className="action-icon">✉️</span>
                <span className="action-text">Check Messages</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => navigate("/admin/products")}
              >
                <span className="action-icon">🛍️</span>
                <span className="action-text">Manage Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="dashboard-footer">
        <div className="system-status">
          <div className="status-item online">
            <span className="status-dot"></span>
            System Online
          </div>
          <div className="status-item">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;