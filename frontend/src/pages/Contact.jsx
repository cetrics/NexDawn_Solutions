import React, { useState, useEffect } from "react";
import axios from "axios";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    axios
      .get("/api/contacts")
      .then((response) => {
        setContacts(response.data);
        setFilteredContacts(response.data);
      })
      .catch((error) => console.error("Error fetching contacts:", error));
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = contacts.filter(
      (contact) =>
        contact.contact_name.toLowerCase().includes(lowerSearch) ||
        contact.contact_subject.toLowerCase().includes(lowerSearch)
    );
    setFilteredContacts(filtered);
  }, [search, contacts]);

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
      marginBottom: "12px",
      fontStyle: "italic",
    },
    subject: {
      fontSize: "16px",
      color: "#555",
      marginBottom: "12px",
    },
    message: {
      fontSize: "15px",
      color: "#444",
      lineHeight: "1.5",
    },
    viewButton: {
      marginTop: "12px",
      padding: "8px 16px",
      backgroundColor: "#007BFF",
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
    noContacts: {
      textAlign: "center",
      color: "#777",
      fontStyle: "italic",
      marginTop: "30px",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📬 Contact Messages</h1>

      <input
        type="text"
        placeholder="Search by name or subject..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.searchInput}
      />

      {filteredContacts.length === 0 ? (
        <p style={styles.noContacts}>No messages match your search.</p>
      ) : (
        filteredContacts.map((contact) => (
          <div key={contact.contact_id} style={styles.card}>
            <div style={styles.name}>{contact.contact_name}</div>
            <div style={styles.email}>{contact.contact_email}</div>{" "}
            {/* Added contact_email */}
            <div style={styles.subject}>{contact.contact_subject}</div>
            <div style={styles.message}>
              {contact.contact_message.length > 200
                ? `${contact.contact_message.substring(0, 200)}...`
                : contact.contact_message}
            </div>
            {contact.contact_message.length > 200 && (
              <button
                style={styles.viewButton}
                onClick={() =>
                  setSelectedMessage({
                    email: contact.contact_email,
                    message: contact.contact_message,
                  })
                }
              >
                View Full Message
              </button>
            )}
          </div>
        ))
      )}

      {/* Modal */}
      {selectedMessage && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Full Message</h3>
              <button
                onClick={() => setSelectedMessage(null)}
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
              From: {selectedMessage.email}
            </p>
            <div style={styles.message}>{selectedMessage.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
