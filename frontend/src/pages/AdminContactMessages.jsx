import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AdminContactMessages.css";
import { useNavigate } from "react-router-dom";

const AdminContactMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user || user.user_type !== "admin") {
      navigate("/login", { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/contact/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setMessages(response.data.messages);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter(
      (message) =>
        message.name?.toLowerCase().includes(query) ||
        message.email?.toLowerCase().includes(query) ||
        message.message?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStats = () => {
    const today = new Date();
    const last7Days = new Date(today.setDate(today.getDate() - 7));

    return {
      total: messages.length,
      today: messages.filter(
        (m) => new Date(m.created_at) > new Date().setHours(0, 0, 0, 0)
      ).length,
      last7Days: messages.filter((m) => new Date(m.created_at) > last7Days)
        .length,
    };
  };

  if (loading) {
    return (
      <div className="admin-messages-loading">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    );
  }

  const stats = getMessageStats();

  return (
    <div className="admin-messages-page">
      <div className="admin-messages-header">
        <h1>Contact Messages</h1>
      </div>

      {/* Statistics Cards */}
      <div className="admin-messages-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.today}</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.last7Days}</span>
          <span className="stat-label">Last 7 Days</span>
        </div>
      </div>

      <div className="admin-messages-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-messages-list">
        {filteredMessages.length === 0 ? (
          <div className="no-messages">No messages found</div>
        ) : (
          <table className="messages-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Email</th>
                <th>Message Preview</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => (
                <tr key={message.id}>
                  <td className="message-sender">
                    <div className="sender-name">{message.name}</div>
                  </td>
                  <td className="message-email">{message.email}</td>
                  <td className="message-preview">
                    {message.message.length > 100
                      ? `${message.message.substring(0, 100)}...`
                      : message.message}
                  </td>
                  <td className="message-date">
                    {formatDate(message.created_at)}
                  </td>
                  <td className="message-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewMessage(message)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Message Details Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message from {selectedMessage.name}</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="message-details-grid">
                <div className="detail-section">
                  <h3>Contact Information</h3>
                  <div className="detail-row">
                    <label>Name:</label>
                    <span>{selectedMessage.name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Email:</label>
                    <span>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="email-link"
                      >
                        {selectedMessage.email}
                      </a>
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Date Sent:</label>
                    <span>{formatDate(selectedMessage.created_at)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Message</h3>
                  <div className="message-content">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Quick Actions</h3>
                  <div className="quick-actions">
                    <button
                      className="btn-copy-email"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMessage.email);
                        toast.success("Email copied to clipboard");
                      }}
                    >
                      Copy Email
                    </button>
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

export default AdminContactMessages;
