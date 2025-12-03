import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/ColorListModal.css";

const ColorListModal = ({ isOpen, onClose, onColorUpdated }) => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingColor, setEditingColor] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchColors();
    }
  }, [isOpen]);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/colors");
      setColors(response.data);
    } catch (error) {
      console.error("Error fetching colors:", error);
      toast.error("Failed to load colors");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (color) => {
    setEditingColor(color);
    setEditName(color.name);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("Color name cannot be empty");
      return;
    }

    try {
      await axios.put(`/api/colors/${editingColor.color_id}`, {
        name: editName,
      });

      toast.success("Color updated successfully");
      setEditingColor(null);
      fetchColors();
      if (onColorUpdated) onColorUpdated();
    } catch (error) {
      console.error("Error updating color:", error);
      toast.error(error.response?.data?.error || "Failed to update color");
    }
  };

  const handleDelete = async (colorId) => {
    if (!window.confirm("Are you sure you want to delete this color?")) {
      return;
    }

    try {
      await axios.delete(`/api/colors/${colorId}`);
      toast.success("Color deleted successfully");
      fetchColors();
      if (onColorUpdated) onColorUpdated();
    } catch (error) {
      console.error("Error deleting color:", error);
      toast.error(error.response?.data?.error || "Failed to delete color");
    }
  };

  const handleCancelEdit = () => {
    setEditingColor(null);
    setEditName("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content color-list-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Manage Colors</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading colors...</div>
          ) : colors.length === 0 ? (
            <div className="empty-state">No colors found</div>
          ) : (
            <div className="colors-list">
              {colors.map((color) => (
                <div key={color.color_id} className="color-item">
                  {editingColor?.color_id === color.color_id ? (
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
                      <span className="color-name">{color.name}</span>
                      <div className="color-actions">
                        <button
                          onClick={() => handleEdit(color)}
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

export default ColorListModal;
