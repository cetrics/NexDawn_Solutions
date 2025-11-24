import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AddCategoryModal.css";

const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded }) => {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/categories", {
        name: categoryName.trim(),
      });

      toast.success("Category added successfully!");
      setCategoryName("");
      onCategoryAdded();
      onClose();
    } catch (error) {
      console.error("Error adding category:", error);
      if (error.response?.status === 409) {
        toast.error("Category already exists");
      } else {
        toast.error(error.response?.data?.error || "Failed to add category");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-category-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add New Category</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label htmlFor="categoryName">Category Name *</label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name (e.g., Electronics, Clothing)"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding Category..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
