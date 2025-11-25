import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "./Header";
import "./css/Wishlist.css";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(savedWishlist);
  }, []);

  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter((item) => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    toast.info("Product removed from wishlist");
  };

  const addToCartFromWishlist = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const productToAdd = {
      ...product,
      quantity: 1,
    };

    const existing = cart.find((item) => item.id === productToAdd.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push(productToAdd);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.name} added to cart`);
  };

  const moveAllToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    wishlist.forEach((product) => {
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    setWishlist([]);
    localStorage.setItem("wishlist", JSON.stringify([]));
    toast.success("All items moved to cart");
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.setItem("wishlist", JSON.stringify([]));
    toast.info("Wishlist cleared");
  };

  return (
    <div className="wishlist-container">
      <Header />

      <div className="wishlist-page">
        <section className="wishlist-section">
          <div className="wishlist-header">
            <h2>My Wishlist ({wishlist.length} items)</h2>
            {wishlist.length > 0 && (
              <div className="wishlist-actions">
                <button
                  className="wishlist-move-all-btn"
                  onClick={moveAllToCart}
                >
                  Move All to Cart
                </button>
                <button
                  className="wishlist-clear-btn"
                  onClick={clearWishlist}
                >
                  Clear Wishlist
                </button>
              </div>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="wishlist-empty">
              <div className="wishlist-empty-icon">🤍</div>
              <h3>Your wishlist is empty</h3>
              <p>Save items you like to your wishlist for later</p>
              <button
                className="wishlist-continue-shopping-btn"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((product, index) => {
                const images =
                  product.images && product.images.length > 0
                    ? product.images
                    : product.image_url
                    ? [product.image_url]
                    : [];

                const discount = product.discount || 0;
                const originalPrice = product.price || 0;
                const discountedPrice =
                  originalPrice - (originalPrice * discount) / 100;

                return (
                  <div className="wishlist-product-card" key={product.id || index}>
                    <div className="wishlist-image-container">
                      {discount > 0 && (
                        <div className="wishlist-discount-badge">
                          {discount}% off
                        </div>
                      )}

                      <button
                        className="wishlist-remove-btn in-wishlist"
                        onClick={() => removeFromWishlist(product.id)}
                        title="Remove from wishlist"
                      >
                        ❤️
                      </button>

                      {images.length > 0 && (
                        <img
                          src={`../static/uploads/${images[0]}`}
                          alt={product.name}
                          className="wishlist-product-image"
                          onError={(e) => {
                            e.target.src = "/static/images/fallback.jpg";
                          }}
                        />
                      )}
                    </div>

                    <h3>
                      {product.name && product.name.length > 55
                        ? product.name.substring(0, 55) + "..."
                        : product.name}
                    </h3>

                    <p className="wishlist-price-line">
                      {discount > 0 ? (
                        <>
                          <span className="wishlist-original-price">
                            KES {originalPrice.toLocaleString()}
                          </span>
                          <span className="wishlist-discounted-price">
                            KES {discountedPrice.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="wishlist-discounted-price">
                          KES {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </p>

                    <div className="wishlist-product-actions">
                      <button
                        className="wishlist-add-to-cart-btn"
                        onClick={() => addToCartFromWishlist(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Wishlist;