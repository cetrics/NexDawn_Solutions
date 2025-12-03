import React, { useState } from "react";
import "./css/Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Message sent successfully! We will get back to you soon.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        alert(`Failed to send message: ${result.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error sending message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Get in touch with NexDawn Technologies</p>
      </div>

      <div className="contact-content">
        <div className="contact-form-section">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Your Message *</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              ></textarea>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div className="contact-info-section">
          <div className="info-card">
            <h3>Our Information</h3>
            <div className="info-item">
              <strong>📍 Address</strong>
              <p>Kutus, Kirinyaga, Kenya</p>
            </div>
            <div className="info-item">
              <strong>📞 Phone</strong>
              <p>+254 731062205</p>
            </div>
            <div className="info-item">
              <strong>✉️ Email</strong>
              <p>info@nexdawn.co.ke</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
