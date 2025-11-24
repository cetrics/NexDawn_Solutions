import React, { useEffect, useState } from "react";
import "./css/CartPage.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [mainImages, setMainImages] = useState({}); // ✅ Store main image per item
  const [savedItems, setSavedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const allSelected = cart.length > 0 && selectedItems.length === cart.length;
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(stored);

    setCart(stored);
    const storedSelected = JSON.parse(localStorage.getItem("selectedItems"));
    if (storedSelected) {
      setSelectedItems(storedSelected);
    } else {
      setSelectedItems([]); // nothing pre-selected
    }

    const storedSaved = JSON.parse(localStorage.getItem("savedItems")) || [];
    setSavedItems(storedSaved);

    // Initialize mainImages state
    const initialImages = {};
    stored.forEach((item) => {
      initialImages[item.id] = item.images?.[0] || "fallback.jpg";
    });
    setMainImages(initialImages);

    // Fetch similar products only if there's something in the cart
    if (stored.length > 0) {
      const categories = [...new Set(stored.map((item) => item.category_name))];

      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (product) =>
              categories.includes(product.category_name) &&
              !stored.some((cartItem) => cartItem.id === product.id)
          );
          setSimilarProducts(filtered);
        })
        .catch((err) => console.error("Error fetching products:", err));
    }
  }, []);

  const removeFromCart = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const saveForLater = (item) => {
    // Remove from cart
    const updatedCart = cart.filter((cartItem) => cartItem.id !== item.id);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Remove from selected items if it was selected
    const updatedSelected = selectedItems.filter((id) => id !== item.id);
    setSelectedItems(updatedSelected);
    localStorage.setItem("selectedItems", JSON.stringify(updatedSelected));

    // Add to saved items
    const updatedSaved = [...savedItems, item];
    setSavedItems(updatedSaved);
    localStorage.setItem("savedItems", JSON.stringify(updatedSaved));

    // Update cart count
    const cartCountEl = document.querySelector(".cart-count");
    if (cartCountEl) {
      const totalItems = updatedCart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountEl.textContent = totalItems;
    }
  };

  const moveToCart = (item) => {
    // Remove from saved
    const updatedSaved = savedItems.filter((saved) => saved.id !== item.id);
    setSavedItems(updatedSaved);
    localStorage.setItem("savedItems", JSON.stringify(updatedSaved));

    // Add to cart
    const updatedCart = [...cart, item];
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // ✅ Make sure it's also selected
    setSelectedItems((prev) => [...prev, item.id]);
    localStorage.setItem(
      "selectedItems",
      JSON.stringify([...selectedItems, item.id])
    );

    // ✅ Ensure mainImages is updated so the image appears immediately
    setMainImages((prev) => ({
      ...prev,
      [item.id]: item.images?.[0] || "fallback.jpg",
    }));
  };

  const updateQuantity = (id, change) => {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const totalPrice = cart
    .filter((item) => selectedItems.includes(item.id)) // ✅ only selected
    .reduce((sum, item) => {
      const price = item.discount
        ? item.price * (1 - item.discount / 100)
        : item.price;
      return sum + price * item.quantity;
    }, 0);

  const [fullscreenImages, setFullscreenImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = (images, startIndex) => {
    setFullscreenImages(images);
    setCurrentImageIndex(startIndex);
    setIsFullscreen(true);
  };

  const nextFullscreenImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % fullscreenImages.length);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  useEffect(() => {
    localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];

    // Update cart state
    setCart(storedCart);

    // Update cart count badge in DOM
    const cartCountEl = document.querySelector(".cart-count");
    if (cartCountEl) {
      const totalItems = storedCart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountEl.textContent = totalItems;
    }
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setSimilarProducts([]);
      return;
    }

    const categories = [...new Set(cart.map((item) => item.category_name))];

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (product) =>
            categories.includes(product.category_name) &&
            !cart.some((cartItem) => cartItem.id === product.id)
        );
        setSimilarProducts(filtered);
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [cart]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      const allIds = cart.map((item) => item.id);
      setSelectedItems(allIds);
    }
  };

  const isAuthenticated = () => {
    return localStorage.getItem("userToken") || localStorage.getItem("token");
  };

  useEffect(() => {
    const cartCountEl = document.querySelector(".cart-count");
    if (cartCountEl) {
      // Count only selected items' quantities
      const totalItems = cart
        .filter((item) => selectedItems.includes(item.id))
        .reduce((sum, item) => sum + (item.quantity || 1), 0);
      cartCountEl.textContent = totalItems;
    }
  }, [selectedItems, cart]);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (Math.abs(deltaY) > 10) {
        e.preventDefault();
        window.scrollBy(0, -deltaY);
        startY = currentY;
      }
    };

    let carousels = [];

    const setupListeners = () => {
      carousels.forEach((carousel) => {
        carousel.removeEventListener("touchstart", handleTouchStart);
        carousel.removeEventListener("touchmove", handleTouchMove);
      });

      carousels = Array.from(document.querySelectorAll(".product-carousel"));

      carousels.forEach((carousel) => {
        carousel.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        carousel.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
      });
    };

    const timer = setTimeout(setupListeners, 100);

    return () => {
      clearTimeout(timer);
      carousels.forEach((carousel) => {
        carousel.removeEventListener("touchstart", handleTouchStart);
        carousel.removeEventListener("touchmove", handleTouchMove);
      });
    };
  }, [similarProducts]);

  return (
    <div>
      <Header />
      <div className="cart-container">
        <div className="cart-left">
          <h2 className="cart-title">Shopping Cart</h2>
          <p className="cart-deselect" onClick={toggleSelectAll}>
            {allSelected ? "Deselect all items" : "Select all items"}
          </p>

          {cart.map((item) => {
            const discountedPrice = item.discount
              ? item.price * (1 - item.discount / 100)
              : item.price;

            return (
              <div className="cart-item" key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => {
                    if (selectedItems.includes(item.id)) {
                      setSelectedItems(
                        selectedItems.filter((id) => id !== item.id)
                      );
                    } else {
                      setSelectedItems([...selectedItems, item.id]);
                    }
                  }}
                />

                <div className="item-image-container">
                  <img
                    src={`/static/uploads/${mainImages[item.id]}`}
                    alt={item.name}
                    className="item-image"
                    onClick={() =>
                      openFullscreen(
                        item.images || [mainImages[item.id]],
                        item.images?.indexOf(mainImages[item.id]) || 0
                      )
                    }
                  />

                  {item.images && item.images.length > 1 && (
                    <div className="thumbnail-row">
                      {item.images.map((thumb, idx) => (
                        <img
                          key={idx}
                          src={`/static/uploads/${thumb}`}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`thumbnail ${
                            mainImages[item.id] === thumb ? "active" : ""
                          }`}
                          onClick={() =>
                            setMainImages((prev) => ({
                              ...prev,
                              [item.id]: thumb,
                            }))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="item-details">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-stock">In Stock</p>
                  {item.colors && (
                    <p className="item-color">
                      Color: {item.colors.map((c) => c.name || c).join("/")}
                    </p>
                  )}

                  <div className="item-actions">
                    <button onClick={() => removeFromCart(item.id)}>
                      Delete
                    </button>
                    <span> | </span>
                    <button onClick={() => saveForLater(item)}>
                      Save for later
                    </button>
                  </div>
                </div>

                <div className="item-price">
                  KES {discountedPrice.toLocaleString()}
                </div>

                <div className="item-qty">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
              </div>
            );
          })}

          {similarProducts.length > 0 && (
            <div className="similar-products">
              <h3>Similar Products</h3>
              <div className="product-grid">
                {similarProducts.map((product, index) => {
                  const discount = product.discount || 0;
                  const originalPrice = product.price;
                  const discountedPrice =
                    discount > 0
                      ? originalPrice * (1 - discount / 100)
                      : originalPrice;
                  const images = product.images || [];
                  const colors = product.colors || [];
                  const stock = product.stock_quantity || 0;

                  return (
                    <div className="product-card" key={product.id || index}>
                      <div className="product-image-container">
                        {discount > 0 && (
                          <div className="discount-badge">{discount}% off</div>
                        )}

                        {images.length > 0 && (
                          <div className="carousel-scroll-wrapper">
                            <Carousel
                              showThumbs={false}
                              showStatus={false}
                              infiniteLoop
                              autoPlay={window.innerWidth > 768}
                              interval={3000}
                              transitionTime={600}
                              stopOnHover
                              emulateTouch
                              swipeable
                              className="product-carousel"
                            >
                              {images.map((filename, i) => (
                                <div key={i}>
                                  <img
                                    src={`/static/uploads/${filename}`}
                                    alt={`${product.name || "Product"} ${
                                      i + 1
                                    }`}
                                    className="carousel-image"
                                    onError={(e) => {
                                      e.target.src =
                                        "/static/images/fallback.jpg";
                                    }}
                                  />
                                </div>
                              ))}
                            </Carousel>
                          </div>
                        )}
                      </div>

                      <h3 className="product-name" title={product.name}>
                        {product.name && product.name.length > 49
                          ? product.name.substring(0, 49) + "..."
                          : product.name || `Product ${index + 1}`}
                      </h3>

                      <p className="product-meta">
                        {colors.length} Color{colors.length !== 1 ? "s" : ""} |{" "}
                        {stock} in stock
                      </p>

                      <p className="price-line vertical">
                        {discount > 0 ? (
                          <>
                            <div className="price-top-row">
                              <span className="original-price">
                                KES {originalPrice.toLocaleString()}
                              </span>
                              <span className="discount-badge">
                                {discount}% off
                              </span>
                            </div>
                            <span className="discounted-price">
                              KES {discountedPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="discounted-price">
                            KES {originalPrice.toLocaleString()}
                          </span>
                        )}
                      </p>

                      {stock > 0 && (
                        <div className="stock-bar-container">
                          <div className="stock-bar-label">
                            {stock} items remaining
                          </div>
                          <div className="stock-bar-track">
                            <div
                              className="stock-bar-fill"
                              style={{
                                width: `${Math.min((stock / 100) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <button
                        className="add-to-cart-btn"
                        onClick={() => {
                          const cart =
                            JSON.parse(localStorage.getItem("cart")) || [];

                          // Ensure we grab the correct image field
                          const productToAdd = {
                            ...product,
                            image:
                              product.mainImage ||
                              product.image ||
                              product.images?.[0] ||
                              "",
                            quantity: 1,
                          };

                          const existing = cart.find(
                            (item) => item.id === productToAdd.id
                          );
                          if (existing) {
                            existing.quantity += 1;
                          } else {
                            cart.push(productToAdd);
                          }

                          localStorage.setItem("cart", JSON.stringify(cart));
                          setCart(cart); // ✅ add this after updating localStorage
                          // after you update `cart` and call setCart(cart):
                          // ✅ Select the new product automatically
                          setSelectedItems((prev) => [
                            ...prev,
                            productToAdd.id,
                          ]);
                          localStorage.setItem(
                            "selectedItems",
                            JSON.stringify([...selectedItems, productToAdd.id])
                          );

                          setMainImages((prev) => ({
                            ...prev,
                            [productToAdd.id]:
                              productToAdd.images?.[0] || "fallback.jpg",
                          }));

                          const cartCountEl =
                            document.querySelector(".cart-count");
                          if (cartCountEl) {
                            const totalItems = cart.reduce(
                              (sum, item) => sum + (item.quantity || 1),
                              0
                            );
                            cartCountEl.textContent = totalItems;
                          }

                          toast.success(`${product.name} added to cart`, {
                            position: "top-right",
                            autoClose: 2500,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: "colored",
                          });
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="cart-right">
          <div className="summary-box">
            <p>
              Subtotal (
              {cart
                .filter((item) => selectedItems.includes(item.id))
                .reduce((sum, item) => sum + (item.quantity || 1), 0)}
              of {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
              items selected):{" "}
              <strong>KES {totalPrice.toLocaleString()}</strong>
            </p>

            <button
              className={`checkout-btn ${
                !isAuthenticated() ? "checkout-btn-guest" : ""
              }`}
              disabled={selectedItems.length === 0}
              onClick={() => {
                if (selectedItems.length === 0) return; // Maintain disabled functionality

                if (!isAuthenticated()) {
                  toast.info("Please sign in to proceed to checkout", {
                    position: "top-right",
                  });
                  navigate("/login?from=/checkout"); // keep query param, not state
                  return;
                }
                navigate("/checkout");
              }}
            >
              {isAuthenticated()
                ? `Proceed to Checkout (${cart
                    .filter((item) => selectedItems.includes(item.id))
                    .reduce((sum, item) => sum + (item.quantity || 1), 0)})`
                : `Sign In to Checkout (${cart
                    .filter((item) => selectedItems.includes(item.id))
                    .reduce((sum, item) => sum + (item.quantity || 1), 0)})`}
            </button>
            {savedItems.length > 0 && (
              <div className="saved-items">
                <h3>Saved for Later</h3>
                {savedItems.map((item) => (
                  <div className="saved-item" key={item.id}>
                    <img
                      src={`/static/uploads/${
                        item.images?.[0] || "fallback.jpg"
                      }`}
                      alt={item.name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>KES {item.price.toLocaleString()}</p>
                      <button onClick={() => moveToCart(item)}>
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {isFullscreen && (
          <div className="fullscreen-overlay" onClick={closeFullscreen}>
            <button className="close-btn" onClick={closeFullscreen}>
              &times;
            </button>

            <button
              className="fullscreen-prev"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(
                  (prev) =>
                    (prev - 1 + fullscreenImages.length) %
                    fullscreenImages.length
                );
              }}
            >
              ‹
            </button>

            <img
              src={`/static/uploads/${fullscreenImages[currentImageIndex]}`}
              alt="Fullscreen"
              className="fullscreen-image"
              onClick={(e) => {
                e.stopPropagation();
                nextFullscreenImage();
              }}
            />

            <button
              className="fullscreen-next"
              onClick={(e) => {
                e.stopPropagation();
                nextFullscreenImage();
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
