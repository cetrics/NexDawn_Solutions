import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./css/AddColorModal.css";

const AddColorModal = ({ isOpen, onClose, onColorAdded }) => {
  const [colorName, setColorName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!colorName.trim()) {
      toast.error("Color name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/colors", {
        color: colorName.trim(),
      });

      toast.success("Color added successfully!");
      setColorName("");
      onColorAdded();
      onClose();
    } catch (error) {
      console.error("Error adding color:", error);
      if (error.response?.status === 409) {
        toast.error("Color already exists");
      } else {
        toast.error(error.response?.data?.error || "Failed to add color");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-color-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add New Color</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label htmlFor="colorName">Color Name *</label>
              <input
                type="text"
                id="colorName"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Enter color name (e.g., Red, Blue, Green)"
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
              {loading ? "Adding Color..." : "Add Color"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColorModal;
