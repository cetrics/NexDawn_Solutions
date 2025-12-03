import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/CategoryListModal.css";

const CategoryListModal = ({ isOpen, onClose, onCategoryUpdated }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      await axios.put(`/api/categories/${editingCategory.id}`, {
        name: editName,
      });

      toast.success("Category updated successfully");
      setEditingCategory(null);
      fetchCategories();
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error.response?.data?.error || "Failed to update category");
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await axios.delete(`/api/categories/${categoryId}`);
      toast.success("Category deleted successfully");
      fetchCategories();
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.response?.data?.error || "Failed to delete category");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content category-list-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">No categories found</div>
          ) : (
            <div className="categories-list">
              {categories.map((category) => (
                <div key={category.id} className="category-item">
                  {editingCategory?.id === category.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={handleUpdate} className="btn-save">
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="category-name">{category.name}</span>
                      <div className="category-actions">
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
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

export default CategoryListModal;
