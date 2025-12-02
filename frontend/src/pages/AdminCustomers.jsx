import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AdminCustomers.css";
import { useNavigate } from "react-router-dom";

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.user_type !== "admin") {
      navigate("/login", { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.email?.toLowerCase().includes(query) ||
        customer.username?.toLowerCase().includes(query) ||
        customer.first_name?.toLowerCase().includes(query) ||
        customer.last_name?.toLowerCase().includes(query) ||
        customer.phone?.includes(query)
    );
  }, [customers, searchQuery]);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCustomerStats = () => {
    return {
      total: customers.length,
      withOrders: customers.filter((c) => c.order_count > 0).length,
      active: customers.filter((c) => c.last_login).length,
    };
  };

  if (loading) {
    return (
      <div className="admin-customers-loading">
        <div className="loading-spinner">Loading customers...</div>
      </div>
    );
  }

  const stats = getCustomerStats();

  return (
    <div className="admin-customers-page">
      <div className="admin-customers-header">
        <h1>All Customers</h1>
      </div>

      {/* Statistics Cards */}
      <div className="admin-customers-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Customers</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.withOrders}</span>
          <span className="stat-label">With Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
      </div>

      <div className="admin-customers-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-customers-list">
        {filteredCustomers.length === 0 ? (
          <div className="no-customers">No customers found</div>
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Last Login</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="customer-info">
                    <div className="customer-name">
                      {customer.first_name || customer.last_name
                        ? `${customer.first_name || ""} ${
                            customer.last_name || ""
                          }`.trim()
                        : customer.username}
                    </div>
                    <div className="customer-username">
                      @{customer.username}
                    </div>
                  </td>
                  <td className="customer-contact">
                    <div className="customer-email">{customer.email}</div>
                    <div className="customer-phone">
                      {customer.phone || "No phone"}
                    </div>
                  </td>
                  <td className="customer-orders">
                    <span className="order-count">
                      {customer.order_count || 0}
                    </span>
                  </td>
                  <td className="customer-last-login">
                    {customer.last_login
                      ? formatDate(customer.last_login)
                      : "Never"}
                  </td>
                  <td className="customer-registered">
                    {formatDate(customer.created_at)}
                  </td>
                  <td className="customer-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(customer)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="customer-details-grid">
                <div className="detail-section">
                  <h3>Personal Information</h3>
                  <div className="detail-row">
                    <label>Name:</label>
                    <span>
                      {selectedCustomer.first_name || selectedCustomer.last_name
                        ? `${selectedCustomer.first_name || ""} ${
                            selectedCustomer.last_name || ""
                          }`.trim()
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Username:</label>
                    <span>@{selectedCustomer.username}</span>
                  </div>
                  <div className="detail-row">
                    <label>Email:</label>
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="detail-row">
                    <label>Phone:</label>
                    <span>{selectedCustomer.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-row">
                    <label>ID Number:</label>
                    <span>{selectedCustomer.id_number || "Not provided"}</span>
                  </div>
                  <div className="detail-row">
                    <label>Gender:</label>
                    <span>{selectedCustomer.gender || "Not specified"}</span>
                  </div>
                  <div className="detail-row">
                    <label>Date of Birth:</label>
                    <span>
                      {selectedCustomer.date_of_birth
                        ? formatDate(selectedCustomer.date_of_birth)
                        : "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Account Information</h3>
                  <div className="detail-row">
                    <label>Total Orders:</label>
                    <span className="order-count-badge">
                      {selectedCustomer.order_count || 0}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Last Login:</label>
                    <span>
                      {selectedCustomer.last_login
                        ? formatDate(selectedCustomer.last_login)
                        : "Never"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Registered:</label>
                    <span>{formatDate(selectedCustomer.created_at)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Account Updated:</label>
                    <span>
                      {selectedCustomer.updated_at
                        ? formatDate(selectedCustomer.updated_at)
                        : "Never"}
                    </span>
                  </div>
                </div>
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

export default AdminCustomers;
