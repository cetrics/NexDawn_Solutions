import React from "react";
import "./css/ProductDetailsModal.css";

const ProductDetailsModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  console.log("Modal received product:", product); // Debug log

  const formatPrice = (price) => {
    return `KES ${price?.toLocaleString() || "0"}`;
  };

  // Helper function to get images
  const getProductImages = () => {
    // Check for images array first
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images;
    }
    // Check for single image property
    if (product.image) {
      return [product.image];
    }
    // Check for image_url
    if (product.image_url) {
      return [product.image_url];
    }
    return [];
  };

  // Helper to get display name
  const getProductName = () => {
    return (
      product.name || product.title || product.product_name || "Unknown Product"
    );
  };

  // Helper to get price
  const getProductPrice = () => {
    return product.price || product.unit_price || product.original_price || 0;
  };

  // Helper to get discount
  const getProductDiscount = () => {
    return product.discount || product.discount_percentage || 0;
  };

  const images = getProductImages();

  return (
    <div className="product-details-modal-overlay" onClick={onClose}>
      <div
        className="product-details-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Product Details</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="product-detail-section">
            {/* Product Images */}
            <div className="product-images">
              {images.length > 0 ? (
                images.map((image, index) => (
                  <img
                    key={index}
                    src={`../static/uploads/${image}`}
                    alt={`${getProductName()} ${index + 1}`}
                    className="detail-image"
                    onError={(e) => {
                      console.error("Image failed to load:", image);
                      e.target.src = "/static/uploads/fallback.png";
                    }}
                  />
                ))
              ) : (
                <div className="no-image">No images available</div>
              )}
            </div>

            {/* Product Information */}
            <div className="product-info-details">
              <h3>{getProductName()}</h3>

              {/* Price Section */}
              <div className="detail-row">
                <label>Price:</label>
                <span className="price-detail">
                  {getProductDiscount() > 0 ? (
                    <>
                      <span className="original">
                        {formatPrice(getProductPrice())}
                      </span>
                      <span className="discounted">
                        {formatPrice(
                          getProductPrice() -
                            (getProductPrice() * getProductDiscount()) / 100
                        )}
                      </span>
                      <span className="discount-badge">
                        {getProductDiscount()}% OFF
                      </span>
                    </>
                  ) : (
                    formatPrice(getProductPrice())
                  )}
                </span>
              </div>

              {/* Quantity */}
              {product.quantity && (
                <div className="detail-row">
                  <label>Quantity:</label>
                  <span>{product.quantity}</span>
                </div>
              )}

              {/* Category */}
              {(product.category_name || product.category) && (
                <div className="detail-row">
                  <label>Category:</label>
                  <span>
                    {product.category_name ||
                      product.category ||
                      "Uncategorized"}
                  </span>
                </div>
              )}

              {/* Colors */}
              {product.colors && (
                <div className="detail-row">
                  <label>Colors:</label>
                  <div className="colors-list">
                    {/* Handle different color formats */}
                    {Array.isArray(product.colors) ? (
                      product.colors.map((color, index) => (
                        <span key={index} className="color-tag">
                          {color.name ||
                            color.color_name ||
                            color ||
                            `Color ${index + 1}`}
                        </span>
                      ))
                    ) : typeof product.colors === "string" ? (
                      <span className="color-tag">{product.colors}</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && (
                <div className="detail-row">
                  <label>Sizes:</label>
                  <div className="sizes-list">
                    {/* Handle different size formats */}
                    {Array.isArray(product.sizes) ? (
                      product.sizes.map((size, index) => (
                        <span key={index} className="size-tag">
                          {size.size_name ||
                            size.name ||
                            size ||
                            `Size ${index + 1}`}
                        </span>
                      ))
                    ) : typeof product.sizes === "string" ? (
                      <span className="size-tag">{product.sizes}</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="detail-row description-row">
                  <label>Description:</label>
                  <p className="product-description">{product.description}</p>
                </div>
              )}

              {/* Show product_id for debugging */}
              {process.env.NODE_ENV === "development" && (
                <div className="detail-row">
                  <label>Product ID:</label>
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>
                    {product.product_id || product.id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
