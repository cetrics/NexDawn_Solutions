import React, { useState, useRef } from "react";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";

const UploadBlog = () => {
  const [content, setContent] = useState("");
  const [blogData, setBlogData] = useState({
    blog_title: "",
    blog_author: "",
    blog_image: null,
  });
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (e) => {
    setBlogData({ ...blogData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setBlogData({ ...blogData, blog_image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("blog_title", blogData.blog_title);
    formData.append("blog_author", blogData.blog_author);
    formData.append("blog_body", content);
    if (blogData.blog_image) {
      formData.append("blog_image", blogData.blog_image);
    }

    try {
      const res = await axios.post("/upload-blog", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        showNotification("success", "✅ Blog uploaded successfully!");
        // Reset all form fields
        setBlogData({ blog_title: "", blog_author: "", blog_image: null });
        setContent("");
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Reset CKEditor content
        if (window.CKEDITOR && window.CKEDITOR.instances.editor1) {
          window.CKEDITOR.instances.editor1.setData("");
        }
      } else {
        showNotification(
          "error",
          "Error: " + (res.data.error || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Upload failed:", err);
      showNotification("error", "An error occurred while uploading the blog.");
    }
  };

  const styles = {
    container: {
      maxWidth: "700px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "20px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "16px",
    },
    fileInput: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontWeight: "600",
      color: "#333",
    },
    button: {
      backgroundColor: "#1e90ff",
      color: "white",
      padding: "12px 20px",
      fontSize: "16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
    heading: {
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#444",
    },
    notification: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 20px",
      borderRadius: "5px",
      color: "white",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      animation: "slideIn 0.3s ease-out",
    },
    success: {
      backgroundColor: "#4CAF50",
      borderLeft: "5px solid #2E7D32",
    },
    error: {
      backgroundColor: "#f44336",
      borderLeft: "5px solid #c62828",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Upload New Blog</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label htmlFor="blog_title" style={styles.label}>
          Blog Title
        </label>
        <input
          type="text"
          name="blog_title"
          id="blog_title"
          placeholder="Enter blog title"
          value={blogData.blog_title}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label htmlFor="blog_author" style={styles.label}>
          Author
        </label>
        <input
          type="text"
          name="blog_author"
          id="blog_author"
          placeholder="Enter author name"
          value={blogData.blog_author}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label htmlFor="blog_image" style={styles.label}>
          Upload Image
        </label>
        <input
          type="file"
          name="blog_image"
          id="blog_image"
          onChange={handleFileChange}
          ref={fileInputRef}
          required
          style={styles.fileInput}
        />

        <label htmlFor="blog_content" style={styles.label}>
          Blog Content
        </label>
        <CKEditor
          id="editor1"
          initData="<p>Start writing here...</p>"
          data={content}
          onChange={(evt) => setContent(evt.editor.getData())}
          config={{
            height: 300,
            removeButtons: "",
            versionCheck: false,
          }}
        />

        <button type="submit" style={styles.button}>
          Submit Blog
        </button>
      </form>

      {notification && (
        <div
          style={{
            ...styles.notification,
            ...(notification.type === "success"
              ? styles.success
              : styles.error),
          }}
        >
          {notification.message}
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default UploadBlog;
