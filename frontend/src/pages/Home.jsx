import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Home.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// CategorySection component
const CategorySection = ({
  category,
  products,
  renderProductCard,
  forceExpand = false,
  isFiltered = false,
}) => {
  const [showAll, setShowAll] = useState(forceExpand);
  const navigate = useNavigate();

  useEffect(() => {
    if (forceExpand) setShowAll(true);
  }, [forceExpand]);

  // If filtering by category, show all products without "See More" button
  if (isFiltered) {
    return (
      <section id={`category-${category}`} className="home-product-section">
        <h2>{category}</h2>
        <div className="home-product-grid">
          {products.map(renderProductCard)}
        </div>
      </section>
    );
  }

  return (
    <section id={`category-${category}`} className="home-product-section">
      <h2>{category}</h2>
      <div className="home-product-grid">
        {(showAll ? products : products.slice(0, 4)).map(renderProductCard)}
      </div>
      {products.length > 4 && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="home-add-to-cart-btn"
            style={{ width: "auto", padding: "6px 20px" }}
          >
            {showAll ? "See Less" : "See More"}
          </button>
        </div>
      )}
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const images = [
    "../static/img/hero4.PNG",
    "../static/img/hero5.PNG",
    "../static/img/hero4.PNG",
  ];

  const [current, setCurrent] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  const [topDeals, setTopDeals] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const query = useQuery();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Load wishlist from localStorage on component mount
  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(savedWishlist);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Handle URL parameters for category filtering
  useEffect(() => {
    const categoryFromUrl = query.get("category");
    const scrollToCategory = query.get("scrollTo");
    const highlightId = query.get("highlight");

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setExpandedCategory(categoryFromUrl);
    }

    if (scrollToCategory) {
      setExpandedCategory(scrollToCategory);

      setTimeout(() => {
        const el = document.getElementById(`category-${scrollToCategory}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (highlightId) {
          setTimeout(() => {
            document
              .querySelectorAll(".home-product-card.home-highlight-flash")
              .forEach((el) => el.classList.remove("home-highlight-flash"));

            const productCard = document.querySelector(
              `.home-product-card[data-id='${highlightId}']`
            );
            if (productCard) {
              productCard.classList.add("home-highlight-flash");

              const removeHighlight = (e) => {
                if (!productCard.contains(e.target)) {
                  productCard.classList.remove("home-highlight-flash");
                  document.removeEventListener("click", removeHighlight);
                }
              };

              document.addEventListener("click", removeHighlight);
            }
          }, 600);
        }
      }, 200);
    }
  }, [location.search, query]);

  // Fetch all products
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        const top = data.filter(
          (product) =>
            product.category_name &&
            product.category_name.toLowerCase() === "top deals"
        );
        const rest = data.filter(
          (product) =>
            !product.category_name ||
            product.category_name.toLowerCase() !== "top deals"
        );
        setTopDeals(top);
        setOtherProducts(rest);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  // Filter products when category changes
  const filteredProducts = selectedCategory
    ? allProducts.filter(
        (product) =>
          product.category_name &&
          product.category_name.toLowerCase() === selectedCategory.toLowerCase()
      )
    : [];

  // Wishlist functions
  const addToWishlist = (product) => {
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      discount: product.discount,
      images: product.images,
      image_url: product.image_url,
      colors: product.colors,
      stock_quantity: product.stock_quantity,
      category_name: product.category_name,
      addedAt: new Date().toISOString(),
    };

    const isInWishlist = wishlist.some((item) => item.id === productToAdd.id);

    if (isInWishlist) {
      removeFromWishlist(productToAdd.id);
      toast.info(`${product.name} removed from wishlist`, {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      setWishlist((prev) => [...prev, productToAdd]);
      toast.success(`${product.name} added to wishlist`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const renderProductCard = (product, index) => {
    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.image_url
        ? [product.image_url]
        : [];

    const colors = product.colors || [];
    const discount = product.discount || 0;
    const originalPrice = product.price || 0;
    const discountedPrice = originalPrice - (originalPrice * discount) / 100;
    const stock = product.stock_quantity ?? 0;
    const inWishlist = isInWishlist(product.id);

    return (
      <div
        className="home-product-card"
        key={product.id || index}
        data-id={product.id}
      >
        <div className="home-product-image-container">
          {discount > 0 && (
            <div className="home-discount-badge">{discount}% off</div>
          )}

          <button
            className={`home-wishlist-btn ${inWishlist ? "in-wishlist" : ""}`}
            onClick={() => addToWishlist(product)}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {inWishlist ? "❤️" : "🤍"}
          </button>

          {images.length > 0 && (
            <img
              src={`../static/uploads/${images[0]}`}
              alt={product.name || "Product"}
              className="home-product-image"
              onError={(e) => {
                e.target.src = "/static/images/fallback.jpg";
              }}
            />
          )}
        </div>

        <h3>
          {product.name && product.name.length > 55
            ? product.name.substring(0, 55) + "..."
            : product.name || `Product ${index + 1}`}
        </h3>

        <p className="home-product-meta">
          {colors.length} Color{colors.length !== 1 ? "s" : ""} | {stock} in
          stock
        </p>

        <p className="home-price-line">
          {discount > 0 ? (
            <>
              <span className="home-original-price">
                KES {originalPrice.toLocaleString()}
              </span>
              <span className="home-discounted-price">
                KES {discountedPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="home-discounted-price">
              KES {originalPrice.toLocaleString()}
            </span>
          )}
        </p>
        {stock > 0 && (
          <div className="home-stock-bar-container">
            <div className="home-stock-bar-label">{stock} items remaining</div>
            <div className="home-stock-bar-track">
              <div
                className="home-stock-bar-fill"
                style={{ width: `${(stock / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="home-product-actions">
          <button
  className={`home-add-to-cart-btn ${stock <= 0 ? 'out-of-stock' : ''}`}
  onClick={() => {
    if (stock <= 0) {
      toast.error(`${product.name} is out of stock`, {
        position: "top-right",
        autoClose: 2000,
      });
      return;
     // Stop execution if out of stock
    }

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
    toast.success(`${product.name} added to cart`, {
      position: "top-right",
      autoClose: 2000,
    });
  }}
  disabled={stock <= 0}
>
  {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
</button>
        </div>
      </div>
    );
  };

  // Rotate background image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="home-container">
      <Header />
      
      {/* Category Filter Banner */}
      {selectedCategory && (
        <div className="category-filter-banner">
          <div className="category-filter-info">
            <span>Showing products in: </span>
            <strong>{selectedCategory}</strong>
            <button 
              className="clear-filter-btn"
              onClick={() => {
                setSelectedCategory("");
                navigate("/");
              }}
            >
              ✕ Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Hero Section with rotating background */}
      <section className="home-hero home-hero-background">
        <div className="home-hero-image-container">
          <img
            src={images[current]}
            alt="Hero background"
            className={`home-hero-image ${imageLoaded ? "loaded" : ""}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error("Failed to load hero image:", e.target.src);
              e.target.src = "/static/images/fallback.jpg";
            }}
          />
        </div>

        <div className="home-hero-content">
          <h2>Bringing Technology & Productivity Together</h2>
          <p>
            Discover computers, accessories, and stationery solutions for your
            personal and business needs.
          </p>
          <div className="home-hero-buttons">
            <button
              className="home-btn home-btn-primary"
              onClick={() => navigate("/products_services")}
            >
              Products & Services
            </button>
            <button
              className="home-btn home-btn-secondary"
              onClick={() => navigate("/contact")}
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Product Sections */}
      <div className="homepage">
        {/* Show filtered products when category is selected */}
        {selectedCategory && !loading && (
          <>
            {filteredProducts.length > 0 ? (
              <CategorySection
                category={selectedCategory}
                products={filteredProducts}
                renderProductCard={renderProductCard}
                isFiltered={true}
              />
            ) : (
              <div className="no-products-message">
                <h2>No products found in {selectedCategory}</h2>
                <p>Please try selecting a different category.</p>
                <button 
                  className="home-add-to-cart-btn"
                  onClick={() => {
                    setSelectedCategory("");
                    navigate("/");
                  }}
                >
                  View All Products
                </button>
              </div>
            )}
          </>
        )}

        {/* Show all products when no category is selected */}
        {!selectedCategory && (
          <>
            {/* Top Deals Section */}
            {!loading && topDeals.length > 0 && (
              <section id="category-Top Deals" className="home-product-section">
                <h2>Top Deals</h2>
                <div className="home-product-grid">
                  {topDeals.map(renderProductCard)}
                </div>
              </section>
            )}

            {/* Grouped Other Products by Category */}
            {!loading &&
              Object.entries(
                otherProducts.reduce((acc, product) => {
                  const category = product.category_name || "Uncategorized";
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(product);
                  return acc;
                }, {})
              ).map(([category, products]) =>
                products.length > 0 ? (
                  <CategorySection
                    key={category}
                    category={category}
                    products={products}
                    renderProductCard={renderProductCard}
                    forceExpand={expandedCategory === category}
                  />
                ) : null
              )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};
export default Home;