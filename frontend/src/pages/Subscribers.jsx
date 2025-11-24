import React, { useEffect, useState } from "react";
import axios from "axios";

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("/api/subscribers")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.subscribers)) {
          setSubscribers(res.data.subscribers);
        } else {
          setSubscribers([]);
          if (!res.data.success) {
            setError("Failed to fetch subscribers");
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching subscribers:", err);
        setError("Error loading subscriber data");
        setSubscribers([]);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <style>{`
        .subscribers-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          font-family: "Segoe UI", sans-serif;
        }

        .subscribers-container h2 {
          color: #007bff
;
          margin-bottom: 25px;
          text-align: center;
          font-size: 24px;
        }

        .subscribers-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .subscriber-card {
          background-color: #fff8f1;
          border: 1px solid #ffd3b6;
          border-left: 4px solid #f96d00;
          padding: 16px;
          border-radius: 10px;
          transition: all 0.3s ease;
          cursor: default;
        }

        .subscriber-card:hover {
          background-color: #fff1e6;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(249, 109, 0, 0.15);
        }

        .loader {
          border: 4px solid #eee;
          border-top: 4px solid #f96d00;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin: 30px auto;
          animation: spin 1s linear infinite;
        }

        .error-message {
          color: #d32f2f;
          background-color: #fde7e7;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .subscribers-container {
            margin: 20px;
            padding: 16px;
          }
        }
      `}</style>

      <div className="subscribers-container">
        <h2>📬 Subscriber List</h2>

        {loading ? (
          <div className="loader"></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : subscribers.length > 0 ? (
          <div className="subscribers-list">
            {subscribers.map((sub) => (
              <div key={sub.id || sub.email} className="subscriber-card">
                <p>
                  <strong>Email:</strong> {sub.email || "N/A"}
                </p>
                <p>
                  <strong>Subscribed:</strong>{" "}
                  {sub.subscribed_at
                    ? new Date(sub.subscribed_at).toLocaleDateString()
                    : "Unknown date"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#666" }}>
            No subscribers found.
          </p>
        )}
      </div>
    </>
  );
};

export default Subscribers;
