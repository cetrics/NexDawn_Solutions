import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CKEditor } from "ckeditor4-react";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, blog: null });
  const [editModal, setEditModal] = useState({ open: false, blog: null });
  const [editContent, setEditContent] = useState("");
  const [editBlogData, setEditBlogData] = useState({
    blog_title: "",
    blog_author: "",
    blog_image: null,
    blog_image_preview: "",
  });
  const editFileInputRef = useRef(null);
  const editorInstanceRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/get-blogs");
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      showNotification("error", "Failed to load blogs");
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      const response = await axios.delete(`/delete-blog/${blogId}`);
      if (response.data.success) {
        showNotification("success", "Blog deleted successfully");
        fetchBlogs();
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      showNotification("error", "Failed to delete blog");
    }
  };

  const openViewModal = (blog) => {
    setViewModal({ open: true, blog });
  };

  const openEditModal = (blog) => {
    setEditModal({ open: true, blog });
    setEditContent(blog.blog_body);
    setEditBlogData({
      blog_title: blog.blog_title,
      blog_author: blog.blog_author,
      blog_image: null,
      blog_image_preview: blog.blog_image
        ? `../static/uploads/${blog.blog_image}`
        : "",
    });
  };

  const handleEditChange = (e) => {
    setEditBlogData({ ...editBlogData, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setEditBlogData({
        ...editBlogData,
        blog_image: file,
        blog_image_preview: URL.createObjectURL(file),
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("blog_title", editBlogData.blog_title);
    formData.append("blog_author", editBlogData.blog_author);
    formData.append("blog_body", editContent);
    if (editBlogData.blog_image) {
      formData.append("blog_image", editBlogData.blog_image);
    }

    try {
      const res = await axios.put(
        `/update-blog/${editModal.blog.blog_id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        showNotification("success", "✅ Blog updated successfully!");
        setEditModal({ open: false, blog: null });
        fetchBlogs();
      } else {
        showNotification(
          "error",
          "Error: " + (res.data.error || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Update failed:", err);
      showNotification("error", "An error occurred while updating the blog.");
    }
  };

  const styles = {
    // ... (keep all your existing styles)
    container: {
      maxWidth: "1200px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    heading: {
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "28px",
      fontWeight: "bold",
      color: "#444",
    },
    blogCard: {
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    blogTitle: {
      fontSize: "22px",
      fontWeight: "600",
      marginBottom: "10px",
      color: "#333",
    },
    blogMeta: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "15px",
      color: "#666",
      fontSize: "14px",
    },
    blogImage: {
      maxWidth: "100%",
      height: "auto",
      borderRadius: "6px",
      marginBottom: "15px",
    },
    blogContent: {
      lineHeight: "1.6",
      color: "#444",
      marginBottom: "15px",
    },
    deleteButton: {
      backgroundColor: "#f44336",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    },
    loading: {
      textAlign: "center",
      padding: "20px",
      color: "#666",
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

    // Add these new styles
    buttonGroup: {
      display: "flex",
      gap: "10px",
      marginTop: "15px",
    },
    viewButton: {
      backgroundColor: "#2196F3",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    },
    editButton: {
      backgroundColor: "#FFC107",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    },
    modalBackdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "8px",
      maxWidth: "800px",
      width: "90%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#333",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#666",
    },
    modalImage: {
      maxWidth: "100%",
      maxHeight: "300px",
      borderRadius: "6px",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "10px",
      fontSize: "15px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      marginBottom: "15px",
      boxSizing: "border-box",
    },

    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#444",
      marginTop: "20px",
    },

    fileInput: {
      marginBottom: "15px",
      fontSize: "14px",
    },

    button: {
      marginTop: "25px",
      backgroundColor: "#28a745",
      color: "#fff",
      padding: "10px 20px",
      fontSize: "16px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Uploaded Blogs</h2>

      {loading ? (
        <div style={styles.loading}>Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <div style={styles.loading}>No blogs found</div>
      ) : (
        blogs.map((blog) => (
          <div key={blog.blog_id} style={styles.blogCard}>
            <h3 style={styles.blogTitle}>{blog.blog_title}</h3>
            <div style={styles.blogMeta}>
              <span>By: {blog.blog_author}</span>
              <span>
                Posted on: {new Date(blog.blog_time).toLocaleString()}
              </span>
            </div>
            {blog.blog_image && (
              <img
                src={`../static/uploads/${blog.blog_image}`}
                alt={blog.blog_title}
                style={styles.blogImage}
              />
            )}
            <div
              style={styles.blogContent}
              dangerouslySetInnerHTML={{
                __html:
                  blog.blog_body.substring(0, 200) +
                  (blog.blog_body.length > 200 ? "..." : ""),
              }}
            />
            <div style={styles.buttonGroup}>
              <button
                style={styles.viewButton}
                onClick={() => openViewModal(blog)}
              >
                View
              </button>
              <button
                style={styles.editButton}
                onClick={() => openEditModal(blog)}
              >
                Edit
              </button>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(blog.blog_id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* View Modal */}
      {viewModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{viewModal.blog.blog_title}</h2>
              <button
                style={styles.closeButton}
                onClick={() => setViewModal({ open: false, blog: null })}
              >
                &times;
              </button>
            </div>
            <div style={styles.blogMeta}>
              <span>By: {viewModal.blog.blog_author}</span>
              <span>
                Posted on: {new Date(viewModal.blog.blog_time).toLocaleString()}
              </span>
            </div>
            {viewModal.blog.blog_image && (
              <img
                src={`../static/uploads/${viewModal.blog.blog_image}`}
                alt={viewModal.blog.blog_title}
                style={styles.modalImage}
              />
            )}
            <div
              dangerouslySetInnerHTML={{ __html: viewModal.blog.blog_body }}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalContent, maxWidth: "700px" }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Blog</h2>
              <button
                style={styles.closeButton}
                onClick={() => setEditModal({ open: false, blog: null })}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit} encType="multipart/form-data">
              <label htmlFor="edit_blog_title" style={styles.label}>
                Blog Title
              </label>
              <input
                type="text"
                name="blog_title"
                id="edit_blog_title"
                placeholder="Enter blog title"
                value={editBlogData.blog_title}
                onChange={handleEditChange}
                required
                style={styles.input}
              />

              <label htmlFor="edit_blog_author" style={styles.label}>
                Author
              </label>
              <input
                type="text"
                name="blog_author"
                id="edit_blog_author"
                placeholder="Enter author name"
                value={editBlogData.blog_author}
                onChange={handleEditChange}
                required
                style={styles.input}
              />

              <label htmlFor="edit_blog_image" style={styles.label}>
                Upload Image (Leave empty to keep current)
              </label>
              {editBlogData.blog_image_preview && (
                <img
                  src={editBlogData.blog_image_preview}
                  alt="Current blog"
                  style={{ ...styles.blogImage, marginBottom: "10px" }}
                />
              )}
              <input
                type="file"
                name="blog_image"
                id="edit_blog_image"
                onChange={handleEditFileChange}
                ref={editFileInputRef}
                style={styles.fileInput}
              />

              <label htmlFor="edit_blog_content" style={styles.label}>
                Blog Content
              </label>
              <CKEditor
                id="editor2"
                onInstanceReady={({ editor }) => {
                  editorInstanceRef.current = editor;
                  editor.setData(editContent); // Inject content into CKEditor manually
                }}
                onChange={(evt) => setEditContent(evt.editor.getData())}
                config={{
                  height: 300,
                  removeButtons: "",
                  versionCheck: false,
                }}
              />

              <button type="submit" style={styles.button}>
                Update Blog
              </button>
            </form>
          </div>
        </div>
      )}

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

export default BlogList;
