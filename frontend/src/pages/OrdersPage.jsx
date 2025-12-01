import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./css/OrdersPage.css";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import ReviewModal from "./ReviewModal";
import ProductDetailsModal from "./ProductDetailsModal"; // Add this import

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [range, setRange] = useState("3m");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [reviewingOrder, setReviewingOrder] = useState(null); // Add this state
  const [reviewedOrders, setReviewedOrders] = useState([]); // Track reviewed orders
  const [viewingProduct, setViewingProduct] = useState(null); // Add this line

  const parseDateEAT = (d) => {
    if (!d) return null;
    return new Date(d);
  };

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log("Fetching orders for user:", decoded.sub);

        const res = await axios.get(`/api/orders/${decoded.sub}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Orders API response:", res.data);

        // Your backend returns the array directly
        const ordersData = Array.isArray(res.data) ? res.data : [];

        console.log("Processed orders data:", ordersData);
        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        console.error("Error response:", err.response?.data);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate]);

  const handleCancelOrder = async (orderNumber) => {
    try {
      await axios.put(
        `/api/orders/${orderNumber}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order_number === orderNumber ? { ...o, status: "cancelled" } : o
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order");
    }
  };

  const handleViewProduct = async (productId, orderItem) => {
    console.log("Viewing product ID:", productId);

    try {
      const response = await axios.get(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Product API response:", response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Use the exact same structure as Admin Products
      const productData = response.data;

      setViewingProduct(productData);
    } catch (err) {
      console.error("Error fetching product details:", err);

      // Fallback using order item data
      if (orderItem) {
        const productData = {
          // Match the API response structure
          id: productId,
          name: orderItem.title || orderItem.name || "Unknown Product",
          price: orderItem.price || orderItem.unit_price || 0,
          discount: orderItem.discount || 0,
          description: orderItem.description || "No description available",
          category_name: orderItem.category || "Uncategorized",
          colors: orderItem.colors || [],
          sizes: orderItem.sizes || [],
          // IMPORTANT: Format images array the same way as API
          images: orderItem.image ? [orderItem.image] : [],
        };

        setViewingProduct(productData);
      } else {
        alert("Product details could not be loaded.");
      }
    }
  };

  const handleArchiveOrder = async (orderNumber) => {
    try {
      await axios.put(
        `/api/orders/${orderNumber}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order_number === orderNumber ? { ...o, status: "archived" } : o
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to archive order");
    }
  };

  const checkIfReviewed = async (orderNumber) => {
    try {
      // Get user_id from token or localStorage
      const decoded = parseJwt(token);
      const userId = decoded?.sub;

      if (!userId) {
        console.error("No user ID found");
        return false;
      }

      const response = await axios.get(`/api/reviews/order/${orderNumber}`, {
        params: { user_id: userId },
      });
      return response.data.has_reviewed;
    } catch (err) {
      console.error("Error checking review status:", err);
      return false;
    }
  };

  // Add function to handle review button click
  const handleReviewClick = (order) => {
    if (reviewedOrders.includes(order.order_number)) {
      alert("You have already reviewed this order.");
      return;
    }
    setReviewingOrder(order);
  };

  // Add function when review is submitted
  const handleReviewSubmitted = (orderNumber) => {
    setReviewedOrders((prev) => [...prev, orderNumber]);
    // Optional: Update the order status or add a reviewed flag
    setOrders((prev) =>
      prev.map((o) =>
        o.order_number === orderNumber ? { ...o, has_reviewed: true } : o
      )
    );
  };

  // Helpers - UPDATED to match your backend structure
  const normalizeItems = (order) => {
    if (!order) return [];

    if (Array.isArray(order.items)) {
      return order.items.map((item, index) => ({
        ...item,
        // Try multiple possible product_id fields
        product_id:
          item.product_id ||
          item.productId ||
          item.id ||
          `temp-${order.order_number}-${index}`,
        // Ensure image is properly set
        image: item.image || item.image_url || item.product_image,
        // Ensure title/name is available
        title: item.title || item.name || item.product_name,
      }));
    }

    if (order.items_summary) {
      return [
        {
          title: order.items_summary,
          product_id: `summary-${order.order_number}`,
        },
      ];
    }

    return [];
  };

  const currency = (order) => "KES"; // Your backend doesn't have currency field
  const money = (num) =>
    typeof num === "number"
      ? num.toLocaleString()
      : Number(num || 0).toLocaleString();

  const formatMetaDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const deliveryLabel = (order) => {
    if (!order) return "Unknown";

    const s = String(order.status || "").toLowerCase();

    // Map your backend statuses to delivery labels
    if (s === "pending") return "Processing";
    if (s === "confirmed") return "Preparing for shipment";
    if (s === "processing") return "Being processed";
    if (s === "shipped") return "Shipped";
    if (s === "delivered") return "Delivered";
    if (s === "cancelled") return "Cancelled";

    return "Processing";
  };

  const statusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "status-pending";
    if (s === "confirmed" || s === "processing") return "status-processing";
    if (s === "shipped") return "status-shipped";
    if (s === "delivered") return "status-success";
    if (s === "cancelled" || s === "failed") return "status-failed";
    if (s === "archived") return "status-archived";
    return "status-pending";
  };

  // Filtering
  const rangeBounds = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "30d": {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return { start, end: now };
      }
      case "3m": {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        return { start, end: now };
      }
      case "6m": {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 6);
        return { start, end: now };
      }
      case "y2025":
        return {
          start: new Date(2025, 0, 1),
          end: new Date(2025, 11, 31, 23, 59, 59),
        };
      case "y2024":
        return {
          start: new Date(2024, 0, 1),
          end: new Date(2024, 11, 31, 23, 59, 59),
        };
      case "all":
      default:
        return null;
    }
  }, [range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const ordersArray = Array.isArray(orders) ? orders : [];
    console.log("Filtering orders:", ordersArray.length);

    return ordersArray
      .filter((o) => {
        if (!rangeBounds || !o) return true;
        const created = parseDateEAT(o.created_at);
        if (!created) return true;
        return created >= rangeBounds.start && created <= rangeBounds.end;
      })
      .filter((o) => {
        if (!o) return false;
        const s = String(o.status || "").toLowerCase();

        if (tab === "all") return s !== "archived";
        if (tab === "open")
          return (
            s === "pending" ||
            s === "confirmed" ||
            s === "processing" ||
            s === "shipped"
          );
        if (tab === "cancelled") return s === "cancelled" || s === "failed";
        if (tab === "archived") return s === "archived";

        return true;
      })
      .filter((o) => {
        if (!q || !o) return true;
        const items = normalizeItems(o);
        const text =
          [
            o.order_number,
            o.payment_method,
            o.status,
            ...items.map((i) => i?.title || i?.name || ""),
          ]
            .join(" ")
            .toLowerCase() || "";
        return text.includes(q);
      })
      .sort((a, b) => {
        const dateA = parseDateEAT(a?.created_at);
        const dateB = parseDateEAT(b?.created_at);
        if (!dateA || !dateB) return 0;
        return dateB - dateA;
      });
  }, [orders, query, tab, range]);

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="loading-spinner">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="orders-page">
        <div className="orders-header">
          <h1>Your Orders</h1>
          <div className="orders-search">
            <input
              type="search"
              placeholder="Search by order number, items, status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search orders"
            />
          </div>
        </div>

        <div className="orders-tabs">
          <button
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            All Orders
          </button>
          <button
            className={tab === "open" ? "active" : ""}
            onClick={() => setTab("open")}
          >
            Open Orders
          </button>
          <button
            className={tab === "archived" ? "active" : ""}
            onClick={() => setTab("archived")}
          >
            Archived Orders
          </button>
          <button
            className={tab === "cancelled" ? "active" : ""}
            onClick={() => setTab("cancelled")}
          >
            Cancelled Orders
          </button>

          <div className="orders-range">
            <label>Orders placed in</label>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="30d">last 30 days</option>
              <option value="3m">past 3 months</option>
              <option value="6m">past 6 months</option>
              <option value="y2025">2025</option>
              <option value="y2024">2024</option>
              <option value="all">all orders</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="orders-empty">
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : "No orders found for the current filters."}
          </p>
        ) : (
          <div className="orders-list">
            {filtered.map((order) => {
              if (!order) return null;

              const items = normalizeItems(order);
              const firstItem = items[0] || {};
              const itemCount = items.length;

              return (
                <article className="order-card" key={order.order_number}>
                  <header className="order-card__meta">
                    <div>
                      <div className="meta-label">ORDER PLACED</div>
                      <div className="meta-value">
                        {formatMetaDate(parseDateEAT(order.created_at))}
                      </div>
                    </div>
                    <div>
                      <div className="meta-label">TOTAL</div>
                      <div className="meta-value">
                        {currency(order)} {money(order.total_amount)}
                      </div>
                    </div>
                    <div>
                      <div className="meta-label">PAYMENT</div>
                      <div className="meta-value">
                        {order.payment_method || "M-Pesa"}
                      </div>
                    </div>
                    <div className="order-card__number">
                      <div className="meta-label">ORDER #</div>
                      <div className="meta-value">{order.order_number}</div>
                    </div>
                  </header>

                  <div className="order-card__status">
                    <span
                      className={`status-pill ${statusClass(order.status)}`}
                    >
                      {order.status || "Pending"}
                    </span>
                    <span className="status-text">{deliveryLabel(order)}</span>
                  </div>

                  <div className="order-card__body">
                    <div className="order-thumb">
                      {firstItem.image ? (
                        <img
                          src={firstItem.image}
                          alt={firstItem.title || "Product"}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="thumb-placeholder" aria-hidden="true">
                          🛍️
                        </div>
                      )}
                    </div>

                    <div className="order-info">
                      <span className="item-title">
                        {firstItem.title ||
                          order.items_summary ||
                          "Your order items"}
                      </span>
                      {itemCount > 1 && (
                        <div className="item-sub">
                          + {itemCount - 1} more item
                          {itemCount - 1 > 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="item-meta">
                        <span>Payment: {order.payment_method || "M-Pesa"}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      {order.status === "pending" ||
                      order.status === "confirmed" ? (
                        <button
                          className="btn"
                          onClick={() => handleCancelOrder(order.order_number)}
                        >
                          Cancel order
                        </button>
                      ) : null}

                      {firstItem.product_id ? (
                        <button
                          className="btn"
                          onClick={() => {
                            console.log(
                              "View Product clicked for item:",
                              firstItem
                            );
                            console.log("Product ID:", firstItem.product_id);
                            handleViewProduct(firstItem.product_id);
                          }}
                        >
                          View Product
                        </button>
                      ) : (
                        <button
                          className="btn"
                          onClick={() =>
                            navigate(
                              `/order-confirmation/${order.order_number}`
                            )
                          }
                        >
                          Order Details
                        </button>
                      )}

                      {/* REVIEW BUTTON FOR DELIVERED ORDERS */}
                      {order.status === "delivered" &&
                        order.status !== "archived" && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleReviewClick(order)}
                              disabled={
                                order.has_reviewed ||
                                reviewedOrders.includes(order.order_number)
                              }
                            >
                              {order.has_reviewed ||
                              reviewedOrders.includes(order.order_number)
                                ? "Reviewed ✓"
                                : "Write Review"}
                            </button>

                            <button
                              className="btn"
                              onClick={() =>
                                handleArchiveOrder(order.order_number)
                              }
                            >
                              Archive
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          isOpen={!!reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Product Details Modal */}
      {viewingProduct && (
        <ProductDetailsModal
          product={viewingProduct}
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
    </div>
  );
};

export default OrdersPage;
