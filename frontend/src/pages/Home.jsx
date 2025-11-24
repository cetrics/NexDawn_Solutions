import React, { useState, useEffect } from "react";
import "./css/Home.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import Header from "./Header"; // Import the Header component

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const slides = [
  {
    title: "Watches",
    image: "../static/images/watch.JPG",
    description: "Premium timepieces for every occasion",
  },
  {
    title: "Baby Toys",
    image: "../static/images/toys.jpg",
    description: "Safe and educational toys for your little ones",
  },
  {
    title: "Gaming",
    image: "../static/images/games.jpg",
    description: "Cutting-edge gaming gear for enthusiasts",
  },
];

// CategorySection component
const CategorySection = ({
  category,
  products,
  renderProductCard,
  forceExpand = false,
}) => {
  const [showAll, setShowAll] = useState(forceExpand);

  useEffect(() => {
    if (forceExpand) setShowAll(true);
  }, [forceExpand]);

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
  // Array of hero background images (you can add more later)
  const images = [
    "../static/img/hero1.png",
    "../static/img/hero2.png",
    "../static/img/hero1.png",
  ];

  const [current, setCurrent] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [topDeals, setTopDeals] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const query = useQuery();
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    const categoryToScroll = query.get("scrollTo") || location.state?.scrollTo;
    const highlightId = query.get("highlight");

    if (categoryToScroll) {
      setExpandedCategory(categoryToScroll);

      setTimeout(() => {
        const el = document.getElementById(`category-${categoryToScroll}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (highlightId) {
          setTimeout(() => {
            // Remove any previous highlight
            document
              .querySelectorAll(".home-product-card.home-highlight-flash")
              .forEach((el) => el.classList.remove("home-highlight-flash"));

            // Find and highlight the target product
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
  }, [location.search, location.state]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
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
        window.scrollBy(0, -deltaY);
        startY = currentY;
      }
    };

    let carousels = [];

    const setupListeners = () => {
      // Detach previous
      carousels.forEach((carousel) => {
        carousel.removeEventListener("touchstart", handleTouchStart);
        carousel.removeEventListener("touchmove", handleTouchMove);
      });

      // Select all carousels including Top Deals
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
  });

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setImageLoaded(false);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setImageLoaded(false);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCountEl = document.querySelector(".cart-count");
    if (cartCountEl) {
      const totalItems = cart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartCountEl.textContent = totalItems;
    }
  }, []);

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

        <button
          className="home-add-to-cart-btn"
          onClick={() => {
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

            // Update cart count
            const cartCountEl = document.querySelector(".cart-count");
            if (cartCountEl) {
              const totalItems = cart.reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );
              cartCountEl.textContent = totalItems;
            }

            toast.success(`${product.name} added to cart`, {
              position: "top-right",
              autoClose: 2000,
            });
          }}
        >
          Add to Cart
        </button>
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

      {/* Hero Section with rotating background */}
      <section
        className="home-hero home-hero-background"
        style={{ backgroundImage: `url(${images[current]})` }}
      >
        <h2>Bringing Technology & Productivity Together</h2>
        <p>
          Discover computers, accessories, and stationery solutions for your
          personal and business needs.
        </p>
        <div className="home-hero-buttons">
          <button className="home-btn home-btn-primary">
            Shop Electronics
          </button>
          <button className="home-btn home-btn-secondary">
            Shop Office Supplies
          </button>
        </div>
      </section>

      {/* Product Sections */}
      <div className="homepage">
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
      </div>
    </div>
  );
};

export default Home;
