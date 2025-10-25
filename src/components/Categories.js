import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import Footer from './Footer';
import { useEnhancedNavigation } from '../hooks/useEnhancedNavigation';
import '../style/Categories.css';

// Constants
const TOAST_DURATION = 3000;
const DEFAULT_CATEGORY_IMAGE = 'https://dummyimage.com/200x200/e5e7eb/6b7280&text=Category';
const ROUTES = {
  CATEGORIES: '/categories',
  PRODUCTS: '/products'
};


const saveScrollPosition = () => window.scrollY;

export default function Categories() {
  const { navigate } = useEnhancedNavigation();
  
  // State management
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);

  // Network status check
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.', {
        duration: TOAST_DURATION,
        position: 'top-center',
      });
      return false;
    }
    return true;
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setLoadingCategories(false);
      return;
    }

    setLoadingCategories(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url, is_restricted')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
      toast.error('Failed to load categories', {
        duration: TOAST_DURATION,
        position: 'top-center',
      });
    } finally {
      setLoadingCategories(false);
    }
  }, []);


  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    
    // Navigate to products page with category filter
    navigate(`${ROUTES.PRODUCTS}?category=${categoryId}`, { 
      state: { 
        scrollPosition: saveScrollPosition(),
        selectedCategory: categoryId,
        fromCategories: true
      } 
    });
  }, [navigate]);

  // Handle search with debouncing
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
  }, [categories]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Handle suggestion click
  const handleSuggestionClick = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSearchQuery(category.name);
      setSuggestions([]);
      // Navigate directly to products page
      navigate(`${ROUTES.PRODUCTS}?category=${categoryId}`, { 
        state: { 
          scrollPosition: saveScrollPosition(),
          selectedCategory: categoryId,
          fromCategories: true
        } 
      });
    }
  }, [categories, navigate]);



  // Load data on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Loading state
  if (loadingCategories && categories.length === 0) {
    return (
      <div className="cat-page">
        <div className="cat-loading">
          <div className="cat-spinner"></div>
          <span>Loading categories...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cat-page">
      <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION }} />

      {/* Header Section */}
      <section className="cat-header-section">
        <h1 className="cat-main-title">Shop by Categories</h1>
        <div className="cat-title-divider"></div>
        
        {/* Search Bar */}
        <div className="cat-search-container">
        <div className="cat-search-bar">
          <span className="cat-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
              onChange={handleSearchChange}
            aria-label="Search categories"
          />
          {suggestions.length > 0 && (
            <ul className="cat-search-suggestions">
              {suggestions.map((category) => (
                <li
                  key={category.id}
                  className="cat-suggestion-item"
                  onClick={() => handleSuggestionClick(category.id)}
                  tabIndex={0}
                  role="option"
                  aria-selected={selectedCategory === category.id}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </section>

      {/* Error State */}
        {error && (
          <div className="cat-error">
            <p>{error}</p>
            <button onClick={() => fetchCategories()}>Retry</button>
          </div>
        )}

      {/* Categories Grid */}
      <section className="cat-categories-section">
        <h2 className="cat-section-title">Browse Categories</h2>
        {loadingCategories ? (
          <div className="cat-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="cat-card cat-card-skeleton">
                <div className="cat-image-skeleton"></div>
                <div className="cat-name cat-skeleton"></div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="cat-empty-state">
            <div className="cat-empty-icon">📦</div>
            <h3>No categories available</h3>
            <p>Check back later for new categories</p>
          </div>
        ) : (
          <div className="cat-grid">
            {/* All Categories Button */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                navigate(ROUTES.PRODUCTS, { 
                  state: { 
                    scrollPosition: saveScrollPosition(),
                    fromCategories: true,
                    showAllProducts: true
                  } 
                });
              }}
              className={`cat-card ${selectedCategory === null ? 'cat-card-selected' : ''}`}
              aria-label="View all products"
            >
              <div className="cat-image-wrapper">
              <img
                src={DEFAULT_CATEGORY_IMAGE}
                alt="All Categories"
                className="cat-image"
                loading="lazy"
              />
              </div>
              <h3 className="cat-name">All Categories</h3>
            </button>

            {/* Category Cards */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`cat-card ${selectedCategory === category.id ? 'cat-card-selected' : ''}`}
                aria-label={`View ${category.name} products`}
              >
                <div className="cat-image-wrapper">
                <img
                  src={category.image_url || DEFAULT_CATEGORY_IMAGE}
                  alt={category.name}
                  className="cat-image"
                  onError={(e) => (e.target.src = DEFAULT_CATEGORY_IMAGE)}
                  loading="lazy"
                />
                </div>
                <h3 className="cat-name">{category.name.trim()}</h3>
              </button>
            ))}
          </div>
        )}
      </section>


      <Footer />
    </div>
  );
}