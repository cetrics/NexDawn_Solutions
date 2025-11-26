import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from './SearchContext';
import './css/UniversalSearch.css';

const UniversalSearch = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    performSearch
  } = useSearch();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowSuggestions]); // Added dependency

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    performSearch(searchTerm, navigate);
  };

  const handleSuggestionClick = (product, e) => {
    e?.stopPropagation(); // Prevent event bubbling
    setShowSuggestions(false);
    performSearch(product.name, navigate);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      performSearch(searchTerm, navigate);
    }
  };

  return (
    <div className="universal-search-container" ref={searchRef}>
      <form onSubmit={handleSubmit} className="universal-search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search for products and categories..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm && setShowSuggestions(true)}
            className="universal-search-input"
          />
          <button type="submit" className="universal-search-button">
            {isSearching ? '⌛' : '🔍'}
          </button>
        </div>

        {showSuggestions && searchResults.length > 0 && (
          <div className="universal-search-suggestions">
            {searchResults.slice(0, 8).map((product) => (
              <div
                key={product.id}
                className="suggestion-item"
                onClick={(e) => handleSuggestionClick(product, e)} // Updated here
              >
                <div className="suggestion-image">
                  {product.images?.[0] ? (
                    <img 
                      src={`../static/uploads/${product.images[0]}`} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/static/images/fallback.jpg';
                      }}
                    />
                  ) : (
                    <div className="suggestion-placeholder">📦</div>
                  )}
                </div>
                <div className="suggestion-details">
                  <div className="suggestion-name">{product.name}</div>
                  <div className="suggestion-category">{product.category_name}</div>
                  <div className="suggestion-price">
                    KES {product.price?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showSuggestions && searchResults.length === 0 && searchTerm && (
          <div className="universal-search-suggestions">
            <div className="no-results">No products found</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default UniversalSearch;