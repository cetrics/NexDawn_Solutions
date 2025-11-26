import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch search suggestions
  // Fetch search suggestions
const fetchSearchSuggestions = async (query) => {
  if (query.trim().length < 2) {
    setSearchResults([]);
    setShowSuggestions(false);
    return;
  }

  try {
    setIsSearching(true);
    const response = await axios.get(`/api/products?search=${encodeURIComponent(query)}`);
    const products = response.data;
    
    const matches = products.filter(product =>
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(matches);
    
    // ONLY show suggestions if the current search term hasn't changed
    // and we're still showing suggestions
    if (searchTerm === query) {
      setShowSuggestions(matches.length > 0);
    }
  } catch (error) {
    console.error('Search error:', error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};

  // Perform search and navigate
  const performSearch = (query, navigate) => {
    if (query.trim()) {
      setSearchTerm(query.trim());
      setShowSuggestions(false);
      
      // Navigate to home page with search params
      if (navigate) {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        fetchSearchSuggestions(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const value = {
    searchTerm,
    setSearchTerm,
    searchResults,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    performSearch,
    clearSearch,
    fetchSearchSuggestions
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};