import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/Products.css";
import AddProductModal from "./AddProductModal";
import AddCategoryModal from "./AddCategoryModal";
import AddColorModal from "./AddColorModal";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(true); // ✅ mark as edit mode
    setShowModal(false); // close the view details modal
    setShowAddProductModal(true); // open the AddProductModal
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const formatPrice = (price) => {
    return `KES ${price?.toLocaleString() || "0"}`;
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: "Out of Stock", class: "out-of-stock" };
    if (quantity < 10) return { text: "Low Stock", class: "low-stock" };
    return { text: "In Stock", class: "in-stock" };
  };

  if (loading) {
    return (
      <div className="products-container">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }
  const handleProductAdded = () => {
    fetchProducts(); // This will refresh the products list after adding
  };
  return (
    <div className="products-container">
      <div className="products-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Products Management</h1>
            <p>Manage your product inventory and details</p>
          </div>
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={() => setShowAddProductModal(true)}
              title="Add Product"
            >
              <span className="btn-icon">📦</span>
              <span className="btn-text">Add Product</span>
            </button>
            <button
              className="action-btn"
              onClick={() => setShowAddColorModal(true)}
              title="Add Color"
            >
              <span className="btn-icon">🎨</span>
              <span className="btn-text">Add Color</span>
            </button>
            <button
              className="action-btn"
              onClick={() => setShowAddCategoryModal(true)}
              title="Add Category"
            >
              <span className="btn-icon">📁</span>
              <span className="btn-text">Add Category</span>
            </button>
          </div>
        </div>
      </div>
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity);
              return (
                <tr key={product.id} className="product-row">
                  <td className="product-name-cell">
                    <div className="product-info">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={`../static/uploads/${product.images[0]}`}
                          alt={product.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.src = "/static/images/fallback.jpg";
                          }}
                        />
                      ) : (
                        <div className="product-thumbnail placeholder">
                          No Image
                        </div>
                      )}
                      <div className="product-details">
                        <span className="product-title">{product.name}</span>
                        {product.discount > 0 && (
                          <span className="discount-tag">
                            {product.discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="price-cell">
                    <div className="price-info">
                      {product.discount > 0 ? (
                        <>
                          <span className="original-price">
                            {formatPrice(product.price)}
                          </span>
                          <span className="discounted-price">
                            {formatPrice(
                              product.price -
                                (product.price * product.discount) / 100
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="current-price">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="stock-cell">
                    <span className={`stock-status ${stockStatus.class}`}>
                      {stockStatus.text}
                    </span>
                    <div className="stock-quantity">
                      {product.stock_quantity} units
                    </div>
                  </td>
                  <td className="category-cell">
                    <span className="category-tag">
                      {product.category_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions-menu">
                      <button
                        className="menu-trigger"
                        onClick={() => handleViewDetails(product)}
                        aria-label="View product details"
                      >
                        <span className="dots">⋯</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        )}
      </div>
      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="product-detail-section">
                <div className="product-images">
                  {selectedProduct.images &&
                  selectedProduct.images.length > 0 ? (
                    selectedProduct.images.map((image, index) => (
                      <img
                        key={index}
                        src={`../static/uploads/${image}`}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        className="detail-image"
                        onError={(e) => {
                          e.target.src = "/static/images/fallback.jpg";
                        }}
                      />
                    ))
                  ) : (
                    <div className="no-image">No images available</div>
                  )}
                </div>

                <div className="product-info-details">
                  <h3>{selectedProduct.name}</h3>

                  <div className="detail-row">
                    <label>Price:</label>
                    <span className="price-detail">
                      {selectedProduct.discount > 0 ? (
                        <>
                          <span className="original">
                            {formatPrice(selectedProduct.price)}
                          </span>
                          <span className="discounted">
                            {formatPrice(
                              selectedProduct.price -
                                (selectedProduct.price *
                                  selectedProduct.discount) /
                                  100
                            )}
                          </span>
                          <span className="discount-badge">
                            {selectedProduct.discount}% OFF
                          </span>
                        </>
                      ) : (
                        formatPrice(selectedProduct.price)
                      )}
                    </span>
                  </div>

                  <div className="detail-row">
                    <label>Stock Quantity:</label>
                    <span
                      className={`stock-detail ${
                        getStockStatus(selectedProduct.stock_quantity).class
                      }`}
                    >
                      {selectedProduct.stock_quantity} units
                    </span>
                  </div>

                  <div className="detail-row">
                    <label>Category:</label>
                    <span>
                      {selectedProduct.category_name || "Uncategorized"}
                    </span>
                  </div>

                  {selectedProduct.colors &&
                    selectedProduct.colors.length > 0 && (
                      <div className="detail-row">
                        <label>Colors:</label>
                        <div className="colors-list">
                          {selectedProduct.colors.map((color, index) => (
                            <span key={index} className="color-tag">
                              {color.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedProduct.sizes &&
                    selectedProduct.sizes.length > 0 && (
                      <div className="detail-row">
                        <label>Sizes:</label>
                        <div className="sizes-list">
                          {selectedProduct.sizes.map((size, index) => (
                            <span key={index} className="size-tag">
                              {size.size_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => handleEditProduct(selectedProduct)}
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          setIsEditing(false);
          setSelectedProduct(null);
        }}
        onProductAdded={handleProductAdded}
        product={selectedProduct} // ✅ send data
        isEditing={isEditing} // ✅ send edit flag
      />

      {/* Add Color Modal */}
      <AddColorModal
        isOpen={showAddColorModal}
        onClose={() => setShowAddColorModal(false)}
        onColorAdded={() => {
          /* Refresh colors if needed */
        }}
      />
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={() => {
          toast.info("Category added successfully!");
        }}
      />
    </div>
  );
};

export default Products;
