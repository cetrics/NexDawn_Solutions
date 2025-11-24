import React, { useState, useEffect } from "react";
import "./css/Budget.css";
import { FaPlus, FaChartPie, FaTrash, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDateRange } from "./DateRangeContext";
import { useNotifications } from "./NotificationContext";
import { useSearchParams } from "react-router-dom";

const Budget = () => {
  const { dateRange } = useDateRange();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newBudget, setNewBudget] = useState({
    item: "",
    amount: "",
    category_id: "",
    spent: "",
  });
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const highlightItem = searchParams.get("item");

  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // ✅ Fetch budgets filtered by date range
  const fetchBudgets = async () => {
    try {
      const query = new URLSearchParams({
        from: dateRange.startDate,
        to: dateRange.endDate,
      }).toString();

      const response = await fetch(`/api/transactions/budgets?${query}`);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);

        // 🔔 Notify if any item exceeds its budget
        data.forEach((item) => {
          if (item.spent > item.amount) {
            addNotification({
              id: item.id,
              item: item.item,
              message: `⚠️ ${item.item} exceeded its budget by KSh ${(
                item.spent - item.amount
              ).toLocaleString()}`,
            });
          }
        });
      } else {
        toast.error("Failed to load budgets");
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Server error while fetching budgets");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/transactions/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // 🔄 Re-fetch on date range change
  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [dateRange]);

  // ✅ Scroll to highlighted item when coming from notification
  // ✅ Scroll to highlighted item when coming from notification
  useEffect(() => {
    if (!loading && highlightItem && budgets.length > 0) {
      const element = document.getElementById(highlightItem);

      if (element) {
        // Delay slightly to ensure the DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-row");

          setTimeout(() => {
            element.classList.remove("highlight-row");
          }, 3000);
        }, 300);
      }
    }
  }, [highlightItem, loading, budgets]);

  // ✅ Add / Edit budget
  const handleSubmitBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.item || !newBudget.amount) return;

    try {
      const isEditing = !!editingBudgetId;
      const url = isEditing
        ? `/api/transactions/budgets/${editingBudgetId}`
        : "/api/transactions/budget";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: newBudget.item,
          amount: parseFloat(newBudget.amount),
          spent: parseFloat(newBudget.spent) || 0, // ✅ include spent
          category_id: newBudget.category_id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditing
            ? "Budget updated successfully!"
            : "Budget added successfully!"
        );
        setNewBudget({ item: "", amount: "", category_id: "" });
        setEditingBudgetId(null);
        fetchBudgets();
      } else {
        toast.error(data.error || "Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Server error while saving budget");
    }
  };

  // ✅ Delete budget
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/transactions/budgets/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        toast.info("Budget deleted");
        fetchBudgets();
      } else {
        toast.error("Failed to delete budget");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Server error while deleting budget");
    }
  };

  // ✅ Add category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      const res = await fetch("/api/transactions/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => [...prev, data.category]);
        toast.success("Category added!");
        setNewCategory("");
      } else {
        toast.error(data.error || "Failed to add category");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      toast.error("Server error while adding category");
    }
  };

  // 🔍 Filtered budgets based on search & category
  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = b.item
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || b.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  // 🧾 Calculate totals from filtered data
  const totalBudget = filteredBudgets.reduce(
    (acc, item) => acc + item.amount,
    0
  );
  const totalSpent = filteredBudgets.reduce((acc, item) => acc + item.spent, 0);

  if (loading) return <div className="budget-page">Loading budgets...</div>;

  return (
    <div className="budget-page">
      <header className="budget-header">
        <div className="budget-header-title">
          <h1>
            <FaChartPie className="budget-header-icon" /> Budget Overview
          </h1>

          <p className="budget-header-subtitle">
            Manage your family's monthly spending goals efficiently.
          </p>
        </div>
      </header>

      {/* Summary */}
      <section className="budget-summary">
        <div className="summary-card">
          <h3>Total Budget</h3>
          <p className="amount">KSh {totalBudget.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Total Spent</h3>
          <p className="amount">KSh {totalSpent.toLocaleString()}</p>
        </div>
        <div className="summary-card savings">
          <h3>Remaining</h3>
          <p className="amount">
            KSh {(totalBudget - totalSpent).toLocaleString()}
          </p>
        </div>
      </section>

      {/* Add Category */}
      <section className="add-category-section">
        <h3>Add New Category</h3>
        <form className="add-category-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
          />
          <button type="submit" className="add-btn">
            <FaPlus /> Add Category
          </button>
        </form>
      </section>
      <button
        className="add-btn"
        onClick={() => {
          setEditingBudgetId(null);
          setNewBudget({ item: "", amount: "", spent: "", category_id: "" });
          setShowBudgetModal(true);
        }}
      >
        <FaPlus /> Add Budget
      </button>

      {/* Table Section */}
      <section className="budget-list-section">
        <h2>Budget by Item</h2>

        {/* 🔍 Search & Filter moved here */}
        <form className="budget-filter-form">
          <input
            type="text"
            placeholder="Search item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            required
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </form>

        <table className="budget-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Budget (KSh)</th>
              <th>Spent (KSh)</th>
              <th>Usage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((item, index) => {
                const usage = (item.spent / item.amount) * 100;
                return (
                  <tr
                    key={item.id || index}
                    id={item.item}
                    className={
                      highlightItem === item.item ? "highlight-row" : ""
                    }
                  >
                    <td>{item.item}</td>
                    <td>{item.category_name || "—"}</td>
                    <td>{item.amount.toLocaleString()}</td>
                    <td>{item.spent.toLocaleString()}</td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${usage}%`,
                            backgroundColor:
                              usage > 100 ? "#ef4444" : "#8b5cf6",
                          }}
                        ></div>
                      </div>
                      <span className="usage-text">{usage.toFixed(0)}%</span>
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingBudgetId(item.id);
                          setNewBudget({
                            item: item.item,
                            amount: item.amount,
                            spent: item.spent,
                            category_id: item.category_id || "",
                          });
                          setShowBudgetModal(true); // ✅ open modal
                        }}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => {
                          setDeleteId(item.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                  No budget records found for selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {showBudgetModal && (
        <div className="modal-overlay">
          <div className="purple-modal">
            {/* ❌ Close Icon (top-right inside modal) */}
            <button
              className="close-modal-btn"
              onClick={() => setShowBudgetModal(false)}
            >
              &times;
            </button>

            <h2>{editingBudgetId ? "Edit Budget" : "Add New Budget"}</h2>

            <form
              className="add-budget-form"
              onSubmit={(e) => {
                handleSubmitBudget(e);
                setShowBudgetModal(false);
              }}
            >
              <div className="form-group">
                <label>Select Category</label>
                <select
                  value={newBudget.category_id}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, category_id: e.target.value })
                  }
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

              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={newBudget.item}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, item: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Budget Amount (KSh)</label>
                <input
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Spent (KSh)</label>
                <input
                  type="number"
                  value={newBudget.spent}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, spent: e.target.value })
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="add-btn">
                  {editingBudgetId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content purple-modal">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this budget?</p>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                No, Cancel
              </button>
              <button
                className="delete-confirm-btn"
                onClick={() => {
                  handleDelete(deleteId);
                  setShowDeleteModal(false);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
