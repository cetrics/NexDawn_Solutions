import React, { useState, useEffect } from "react";
import "./css/Settings.css";
import { FaUserCircle, FaCog, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";

const Settings = () => {
  const [settings, setSettings] = useState({
    full_name: "",
    family_group: "",
    currency: "KSh",
    theme: "light",
    notifications: true,
    goal: 0,
  });

  // ✅ Fetch settings from backend
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        toast.error("Failed to load settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Server error while loading settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ✅ Save settings to backend
  const handleSave = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("✅ Settings saved successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Server error while saving settings");
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
  <div className="settings-header-title">
    <h1>
      <FaCog className="settings-header-icon" /> Settings
    </h1>
    <p className="settings-header-subtitle">
      Manage your profile, preferences, and savings goals.
    </p>
  </div>
</header>


      <section className="settings-section profile">
        <h2>
          <FaUserCircle /> Profile
        </h2>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={settings.full_name}
            onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Family Group</label>
          <input
            type="text"
            value={settings.family_group}
            onChange={(e) => setSettings({ ...settings, family_group: e.target.value })}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>
          <FaCog /> Preferences
        </h2>

        <div className="form-group">
          <label>Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          >
            <option value="KSh">KSh (Kenyan Shilling)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
          >
            <option value="purple">Purple</option>
          </select>
        </div>

        <div className="toggle-group">
          <label>
            <FaBell /> Enable Notifications
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={() =>
                setSettings({ ...settings, notifications: !settings.notifications })
              }
            />
            <span className="slider"></span>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2>💰 Savings Goal</h2>
        <div className="form-group">
          <label>Monthly Savings Target</label>
          <input
            type="number"
            value={settings.goal}
            onChange={(e) => setSettings({ ...settings, goal: e.target.value })}
          />
        </div>
      </section>

      <button className="save-btn" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
