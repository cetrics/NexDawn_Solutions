import React, { useState, useEffect } from "react";
import axios from "axios";

const GivingRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    axios
      .get("/api/giving-records")
      .then((response) => {
        setRecords(response.data);
        setFilteredRecords(response.data);
      })
      .catch((error) => console.error("Error fetching giving records:", error));
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = records.filter(
      (record) =>
        record.name.toLowerCase().includes(lowerSearch) ||
        record.email.toLowerCase().includes(lowerSearch) ||
        record.purpose.toLowerCase().includes(lowerSearch)
    );
    setFilteredRecords(filtered);
  }, [search, records]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const styles = {
    container: {
      maxWidth: "1000px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "#f9f9f9",
      borderRadius: "10px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    heading: {
      textAlign: "center",
      fontSize: "32px",
      marginBottom: "30px",
      color: "#333",
    },
    searchInput: {
      width: "100%",
      padding: "10px",
      marginBottom: "20px",
      fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "6px",
    },
    card: {
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    },
    name: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "4px",
    },
    email: {
      fontSize: "14px",
      color: "#888",
      marginBottom: "8px",
      fontStyle: "italic",
    },
    amount: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#27ae60",
      marginBottom: "8px",
    },
    details: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "12px",
      flexWrap: "wrap",
    },
    detailItem: {
      marginRight: "15px",
      fontSize: "14px",
      color: "#555",
    },
    purpose: {
      fontSize: "15px",
      color: "#444",
      lineHeight: "1.5",
      fontStyle: "italic",
    },
    viewButton: {
      marginTop: "12px",
      padding: "8px 16px",
      backgroundColor: "#27ae60",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px",
    },
    modalBackdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "30px",
      borderRadius: "10px",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 5px 20px rgba(0, 0, 0, 0.3)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "bold",
    },
    closeButton: {
      fontSize: "20px",
      cursor: "pointer",
      background: "none",
      border: "none",
      color: "#888",
    },
    noRecords: {
      textAlign: "center",
      color: "#777",
      fontStyle: "italic",
      marginTop: "30px",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>💵 Giving Records</h1>

      <input
        type="text"
        placeholder="Search by name, email or purpose..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.searchInput}
      />

      {filteredRecords.length === 0 ? (
        <p style={styles.noRecords}>No giving records match your search.</p>
      ) : (
        filteredRecords.map((record) => (
          <div key={record.id} style={styles.card}>
            <div style={styles.name}>{record.name}</div>
            <div style={styles.email}>{record.email}</div>
            <div style={styles.amount}>
              {formatCurrency(record.amount, record.currency)}
            </div>
            <div style={styles.details}>
              <span style={styles.detailItem}>
                <strong>Phone:</strong> {record.phone || "Not provided"}
              </span>
              <span style={styles.detailItem}>
                <strong>Date:</strong>{" "}
                {new Date(record.date_given).toLocaleDateString()}
              </span>
            </div>
            <div style={styles.purpose}>
              <strong>Purpose:</strong> {record.purpose || "General giving"}
            </div>
          </div>
        ))
      )}

      {/* Modal - Not currently used but kept for consistency */}
      {selectedRecord && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Giving Details</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={styles.closeButton}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <p
              style={{
                fontStyle: "italic",
                color: "#666",
                marginBottom: "15px",
              }}
            >
              From: {selectedRecord.email}
            </p>
            <div style={styles.message}>{selectedRecord.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GivingRecords;
