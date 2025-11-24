import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/AddAddressPage.css";

const AddAddressPage = () => {
  const [newAddress, setNewAddress] = useState({
    address_type: "Home",
    contact_name: "",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    town: "",
    county: "",
    postal_code: "",
    country: "",
    is_default: false,
  });

  const [successPopup, setSuccessPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("/api/addresses/", newAddress, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Address added successfully:", response.data);
      setSuccessPopup(true);
    } catch (err) {
      console.error("Error adding address:", err);
      alert("Failed to add address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-address-container">
      <div className="add-address-header">
        <h2 className="add-address-title">Add New Address</h2>
        <p className="add-address-subtitle">
          Enter your delivery address details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="address-form">
        {[
          {
            label: "Contact Name",
            key: "contact_name",
            type: "text",
            required: true,
          },
          {
            label: "Phone Number",
            key: "contact_phone",
            type: "tel",
            required: true,
          },
          {
            label: "Address Line 1",
            key: "address_line1",
            type: "text",
            required: true,
          },
          {
            label: "Address Line 2",
            key: "address_line2",
            type: "text",
            required: false,
          },
          { label: "Town/City", key: "town", type: "text", required: true },
          { label: "County", key: "county", type: "text", required: true },
          {
            label: "Postal Code",
            key: "postal_code",
            type: "text",
            required: true,
          },
          { label: "Country", key: "country", type: "text", required: true },
        ].map((field) => (
          <div className="form-group" key={field.key}>
            <label>
              {field.label}
              {field.required && <span style={{ color: "#dc3545" }}> *</span>}
            </label>
            <input
              type={field.type}
              value={newAddress[field.key]}
              onChange={(e) =>
                setNewAddress({ ...newAddress, [field.key]: e.target.value })
              }
              required={field.required}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="default-address"
            checked={newAddress.is_default}
            onChange={(e) =>
              setNewAddress({ ...newAddress, is_default: e.target.checked })
            }
          />
          <label htmlFor="default-address">Set as default address</label>
        </div>

        <button type="submit" className="save-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <div
                className="loading-spinner"
                style={{
                  width: "16px",
                  height: "16px",
                  display: "inline-block",
                  marginRight: "8px",
                }}
              ></div>
              Saving...
            </>
          ) : (
            "Save Address"
          )}
        </button>
      </form>

      {successPopup && (
        <div className="popup-backdrop">
          <div className="popup-card">
            <h3>
              <span style={{ fontSize: "1.5em", marginRight: "10px" }}>✅</span>
              Address Added Successfully!
            </h3>
            <p>Your address has been saved and is ready for use.</p>
            <button className="ok-btn" onClick={() => navigate("/checkout")}>
              Continue to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAddressPage;
