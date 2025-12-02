import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AdminOrders.css";
import { useNavigate, useLocation } from "react-router-dom";

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightOrder = params.get("highlight");

    if (highlightOrder) {
      // Scroll to the order after a short delay
      setTimeout(() => {
        const element = document.querySelector(
          `[data-order="${highlightOrder}"]`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-order");

          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.classList.remove("highlight-order");
          }, 3000);
        }
      }, 500);
    }
  }, [location.search]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.user_type !== "admin") {
      navigate("/login", { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderNumber, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/orders/${orderNumber}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.order_number === orderNumber
            ? { ...order, status: newStatus }
            : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(query) ||
          order.user_email?.toLowerCase().includes(query) ||
          order.items_summary?.toLowerCase().includes(query) ||
          (order.first_name &&
            order.first_name.toLowerCase().includes(query)) ||
          (order.last_name && order.last_name.toLowerCase().includes(query))
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [orders, statusFilter, searchQuery]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${Number(amount).toLocaleString()}`;
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      confirmed: "status-confirmed",
      processing: "status-processing",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
      archived: "status-archived",
    };
    return statusMap[status?.toLowerCase()] || "status-pending";
  };

  // Get full customer name
  const getCustomerName = (order) => {
    if (order.first_name || order.last_name) {
      return `${order.first_name || ""} ${order.last_name || ""}`.trim();
    }
    return "N/A";
  };

  // Statistics for all statuses
  const statusStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="admin-orders-loading">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <h1>All Orders</h1>
      </div>

      {/* Statistics Cards */}
      <div className="admin-orders-stats">
        <div className="stat-card">
          <span className="stat-number">{statusStats.total}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.confirmed}</span>
          <span className="stat-label">Confirmed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.processing}</span>
          <span className="stat-label">Processing</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.shipped}</span>
          <span className="stat-label">Shipped</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{statusStats.cancelled}</span>
          <span className="stat-label">Cancelled</span>
        </div>
      </div>

      <div className="admin-orders-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by order number, email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="admin-orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">No orders found</div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_number} data-order={order.order_number}>
                  <td className="order-number">{order.order_number}</td>
                  <td className="customer-info">
                    <div className="customer-name">
                      {getCustomerName(order)}
                    </div>
                    <div className="customer-email">
                      {order.user_email || "N/A"}
                    </div>
                  </td>
                  <td className="order-amount">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="order-status">
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status || "Pending"}
                    </span>
                  </td>
                  <td className="order-date">{formatDate(order.created_at)}</td>
                  <td className="order-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(order)}
                    >
                      View
                    </button>
                    <select
                      value={order.status || "pending"}
                      onChange={(e) =>
                        updateOrderStatus(order.order_number, e.target.value)
                      }
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.order_number}</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-details-grid">
                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-row">
                    <label>Order Number:</label>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Total Amount:</label>
                    <span className="amount">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Payment Method:</label>
                    <span>{selectedOrder.payment_method || "M-Pesa"}</span>
                  </div>
                  <div className="detail-row">
                    <label>Order Date:</label>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="detail-row">
                    <label>First Name:</label>
                    <span>{selectedOrder.first_name || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <label>Last Name:</label>
                    <span>{selectedOrder.last_name || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <label>Full Name:</label>
                    <span className="customer-full-name">
                      {getCustomerName(selectedOrder)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Email:</label>
                    <span>{selectedOrder.user_email || "N/A"}</span>
                  </div>
                  {selectedOrder.phone && (
                    <div className="detail-row">
                      <label>Phone:</label>
                      <span>{selectedOrder.phone}</span>
                    </div>
                  )}
                </div>
                {/* ADD THE DELIVERY DETAILS SECTION HERE */}
                {selectedOrder.address_line1 && (
                  <div className="detail-section">
                    <h3>Delivery Details</h3>
                    <div className="detail-row">
                      <label>Contact Name:</label>
                      <span>{selectedOrder.contact_name || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <label>Contact Phone:</label>
                      <span>{selectedOrder.contact_phone || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <label>Address:</label>
                      <span className="address-full">
                        {selectedOrder.address_line1}
                        {selectedOrder.address_line2 &&
                          `, ${selectedOrder.address_line2}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>Town/City:</label>
                      <span>{selectedOrder.town || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <label>County:</label>
                      <span>{selectedOrder.county || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <label>Postal Code:</label>
                      <span>{selectedOrder.postal_code || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <label>Country:</label>
                      <span>{selectedOrder.country || "N/A"}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="detail-section">
                    <h3>Order Items</h3>
                    <div className="order-items-list">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="item-image">
                            {item.image ? (
                              <img src={item.image} alt={item.title} />
                            ) : (
                              <div className="image-placeholder">📦</div>
                            )}
                          </div>
                          <div className="item-details">
                            <div className="item-title">{item.title}</div>
                            <div className="item-price">
                              {formatCurrency(item.price)}
                            </div>
                            <div className="item-quantity">
                              Quantity: {item.quantity}
                            </div>
                            <div className="item-total">
                              Total:{" "}
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="order-summary">
                      <div className="summary-row">
                        <label>Subtotal:</label>
                        <span>
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                      <div className="summary-row total">
                        <label>Total Amount:</label>
                        <span>
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
