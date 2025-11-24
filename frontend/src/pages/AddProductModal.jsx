import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AddProductModal.css";

const AddProductModal = ({
  isOpen,
  onClose,
  onProductAdded,
  product,
  isEditing,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    brand: "",
    stock_quantity: "",
    discount: "",
    colors: [], // ✅ keep colors array
    sizes: [],
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [colorOptions, setColorOptions] = useState([]); // ✅ store colors from API
  const [existingImages, setExistingImages] = useState([]);

  // ✅ Fetch categories and colors when modal opens
  useEffect(() => {
    if (isOpen) {
      axios
        .get("/api/categories")
        .then((res) => setCategories(res.data))
        .catch(() => toast.error("Failed to load categories"));

      axios
        .get("/api/colors")
        .then((res) => setColorOptions(res.data))
        .catch(() => toast.error("Failed to load colors"));

      // ✅ Prefill form for editing
      if (isEditing && product) {
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price || "",
          category_id: product.category_id || "",
          brand: product.brand || "",
          stock_quantity: product.stock_quantity || "",
          discount: product.discount || "",
          colors: product.colors?.map((c) => c.color_id?.toString()) || [],
          sizes: product.sizes?.map((s) => s.size_id?.toString()) || [],
        });

        // ✅ Set existing images for editing
        setExistingImages(product.images || []);
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          category_id: "",
          brand: "",
          stock_quantity: "",
          discount: "",
          colors: [],
          sizes: [],
        });
        setImages([]);
        setExistingImages([]); // Clear existing images for new product
      }
    }
  }, [isOpen, isEditing, product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemoveExistingImage = (imageToRemove) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageToRemove));
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // ✅ Handle multiple color selections
  const handleColorChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      colors: selectedOptions,
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "colors" || key === "sizes") {
          formData[key].forEach((value) => data.append(key, value));
        } else {
          data.append(key, formData[key]);
        }
      });

      // Append new images
      images.forEach((image) => data.append("images", image));

      // Append remaining existing images
      existingImages.forEach((image) => data.append("existing_images", image));

      if (isEditing && product) {
        // ✅ Update existing product
        await axios.put(`/api/products/${product.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated successfully!");
      } else {
        // ✅ Add new product
        await axios.post("/api/products", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product added successfully!");
      }

      onProductAdded();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-product-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEditing ? "Edit Product" : "Add New Product"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>

              <div className="input-group">
                <label>Price (KES) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>

              <div className="input-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* ✅ Replaced Material with Color multi-select */}
              <div className="input-group">
                <label>Colors *</label>
                <div className="colors-checkbox-group">
                  {colorOptions.map((color) => (
                    <label
                      key={color.color_id}
                      className="color-checkbox-label"
                    >
                      <input
                        type="checkbox"
                        name="colors"
                        value={color.color_id.toString()}
                        checked={formData.colors.includes(
                          color.color_id.toString()
                        )}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            colors: e.target.checked
                              ? [...prev.colors, value]
                              : prev.colors.filter((color) => color !== value),
                          }));
                        }}
                      />
                      <span className="color-checkbox-text">{color.name}</span>
                    </label>
                  ))}
                </div>
                {formData.colors.length === 0 && (
                  <small className="error-text">
                    Please select at least one color
                  </small>
                )}
              </div>

              <div className="input-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                />
              </div>

              <div className="input-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="input-group full-width">
                <label>Product Images *</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  required={
                    !isEditing ||
                    (existingImages.length === 0 && images.length === 0)
                  }
                />
                <small>Select multiple images (JPEG, PNG, JPG, GIF)</small>

                {/* Display existing images for editing */}
                {isEditing && existingImages.length > 0 && (
                  <div className="existing-images">
                    <h4>Current Images:</h4>
                    <div className="image-preview-grid">
                      {existingImages.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img
                            src={`../static/uploads/${image}`}
                            alt={`Existing ${index + 1}`}
                            className="preview-image"
                            onError={(e) => {
                              e.target.src = "/static/images/fallback.jpg";
                            }}
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveExistingImage(image)}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display newly selected images */}
                {images.length > 0 && (
                  <div className="new-images">
                    <h4>New Images:</h4>
                    <div className="image-preview-grid">
                      {images.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            className="preview-image"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveNewImage(index)}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Adding..."
                : isEditing
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
