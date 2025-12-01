// ReviewModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./css/ReviewModal.css";
import { toast } from "react-toastify";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

const ReviewModal = ({ order, isOpen, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const token = localStorage.getItem("token");

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!order.items || order.items.length === 0) {
      setError("No products found to review");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const productId = order.items[0].product_id || order.items[0].id;

      // Get user_id from token
      const decoded = parseJwt(token);
      const userId = decoded?.sub;

      if (!userId) {
        setError("User not authenticated");
        return;
      }

      const response = await axios.post("/api/reviews", {
        user_id: userId,
        product_id: productId,
        order_number: order.order_number, // ✅ UPDATED
        rating: rating,
        comment: comment.trim() || null,
      });

      if (response.status === 201) {
        toast.success("Review submitted successfully!");
        onReviewSubmitted(order.order_number);
        onClose();
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      console.error("Error response:", err.response?.data);

      if (err.response?.status === 409) {
        setError("You have already reviewed this product");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const product = order.items?.[0] || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Your Purchase</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="product-info">
            <div className="product-image">
              {product.image ? (
                <img src={product.image} alt={product.title || "Product"} />
              ) : (
                <div className="image-placeholder">🛍️</div>
              )}
            </div>
            <div className="product-details">
              <h3>{product.title || "Your Product"}</h3>
              <p className="order-number">Order #: {order.order_number}</p>
              <p className="delivery-date">
                Delivered on:{" "}
                {new Date(
                  order.delivered_at || order.updated_at
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="rating-section">
            <h4>How would you rate this product?</h4>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${
                    star <= (hoveredStar || rating) ? "active" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="comment-section">
            <label htmlFor="review-comment">Your Review (Optional)</label>
            <textarea
              id="review-comment"
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="char-count">{comment.length}/500</div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              className="btn btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-submit"
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>

          <p className="disclaimer">
            * You can only submit one review per order. This cannot be changed
            later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
