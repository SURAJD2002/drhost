import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useScrollPosition, useEnhancedNavigation } from '../hooks/scrollManager';

/**
 * Example CategoryPage Component
 * Demonstrates scroll management for category pages with product listings
 */
function ExampleCategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initialize scroll management with category-specific key
  const { enhancedNavigate } = useEnhancedNavigation();
  const scrollKey = `/category/${categorySlug}`;
  useScrollPosition(scrollKey); // Use category-specific key for scroll memory

  // Mock product data based on category
  const generateProducts = useCallback((categorySlug, page = 1) => {
    const categoryProducts = {
      electronics: [
        { id: 101, name: 'iPhone 15 Pro', price: 99999, image: '📱' },
        { id: 102, name: 'Samsung Galaxy S24', price: 89999, image: '📱' },
        { id: 103, name: 'MacBook Pro M3', price: 159999, image: '💻' },
        { id: 104, name: 'iPad Air', price: 59999, image: '📱' },
        { id: 105, name: 'AirPods Pro', price: 24999, image: '🎧' },
        { id: 106, name: 'Sony WH-1000XM5', price: 29999, image: '🎧' },
        { id: 107, name: 'Apple Watch Series 9', price: 49999, image: '⌚' },
        { id: 108, name: 'Samsung Galaxy Watch', price: 29999, image: '⌚' }
      ],
      fashion: [
        { id: 201, name: 'Designer Handbag', price: 25000, image: '👜' },
        { id: 202, name: 'Leather Jacket', price: 15000, image: '🧥' },
        { id: 203, name: 'Silk Scarf', price: 5000, image: '🧣' },
        { id: 204, name: 'Designer Shoes', price: 12000, image: '👠' },
        { id: 205, name: 'Premium T-Shirt', price: 2000, image: '👕' },
        { id: 206, name: 'Denim Jeans', price: 3500, image: '👖' },
        { id: 207, name: 'Winter Coat', price: 18000, image: '🧥' },
        { id: 208, name: 'Evening Dress', price: 22000, image: '👗' }
      ],
      jewellery: [
        { id: 301, name: 'Gold Necklace', price: 45000, image: '📿' },
        { id: 302, name: 'Diamond Ring', price: 85000, image: '💍' },
        { id: 303, name: 'Pearl Earrings', price: 25000, image: '💎' },
        { id: 304, name: 'Silver Bracelet', price: 15000, image: '📿' },
        { id: 305, name: 'Platinum Chain', price: 65000, image: '📿' },
        { id: 306, name: 'Ruby Pendant', price: 35000, image: '💎' },
        { id: 307, name: 'Emerald Set', price: 95000, image: '💍' },
        { id: 308, name: 'Gold Bangles', price: 28000, image: '📿' }
      ]
    };

    const categoryData = categoryProducts[categorySlug] || [];
    const itemsPerPage = 6;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return categoryData.slice(startIndex, endIndex);
  }, []);

  // Load products for the category
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newProducts = generateProducts(categorySlug, page);
      const categoryData = generateProducts(categorySlug, 1);
      
      if (page === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(newProducts.length === 6 && page * 6 < categoryData.length);
      setLoading(false);
    };

    loadProducts();
  }, [categorySlug, page, generateProducts]);

  // Handle product click
  const handleProductClick = (product) => {
    enhancedNavigate(`/product/${product.id}`, {
      state: {
        fromCategory: true,
        categorySlug,
        categoryName: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
        productName: product.name,
        scrollPosition: window.scrollY
      }
    });
  };

  // Handle back navigation
  const handleBackClick = () => {
    enhancedNavigate('/', {
      state: {
        fromCategory: true,
        categorySlug
      }
    });
  };

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const categoryName = categorySlug ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1) : 'Category';

  return (
    <div className="category-page">
      {/* Header */}
      <header className="category-header">
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label="Go back to home"
        >
          ← Back to Home
        </button>
        <h1>🏷️ {categoryName} Products</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Main Content */}
      <main className="category-content">
        {/* Category Info */}
        <section className="category-info">
          <h2>Discover Amazing {categoryName} Products</h2>
          <p>Browse through our curated collection of premium {categoryName.toLowerCase()} items</p>
          <div className="category-stats">
            <span className="product-count">{products.length} products</span>
            <span className="category-badge">{categoryName}</span>
          </div>
        </section>

        {/* Products Grid */}
        <section className="products-section">
          {loading && page === 1 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading {categoryName.toLowerCase()} products...</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => handleProductClick(product)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleProductClick(product)}
                    aria-label={`View ${product.name} details`}
                  >
                    <div className="product-image">
                      <div className="product-emoji">{product.image}</div>
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-price">₹{product.price.toLocaleString()}</p>
                      <div className="product-badge">Best Seller</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="load-more-section">
                  {loading ? (
                    <div className="loading-more">
                      <div className="loading-spinner small"></div>
                      <span>Loading more products...</span>
                    </div>
                  ) : (
                    <button 
                      className="load-more-button"
                      onClick={() => setPage(prev => prev + 1)}
                    >
                      Load More Products
                    </button>
                  )}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && products.length > 0 && (
                <div className="end-results">
                  <p>🎉 You've reached the end of {categoryName.toLowerCase()} products!</p>
                  <p>Check out other categories for more amazing deals.</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Category Features */}
        <section className="category-features">
          <h3>Why Shop {categoryName} at Markeet?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <h4>Fast Delivery</h4>
              <p>Same-day delivery available for select {categoryName.toLowerCase()} items</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💎</span>
              <h4>Premium Quality</h4>
              <p>Only authentic and high-quality {categoryName.toLowerCase()} products</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <h4>Best Prices</h4>
              <p>Competitive pricing with exclusive deals and discounts</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <h4>Easy Returns</h4>
              <p>30-day return policy for all {categoryName.toLowerCase()} purchases</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="category-footer">
        <p>Continue shopping and discover more amazing products!</p>
        <button 
          className="browse-categories-button"
          onClick={handleBackClick}
        >
          Browse All Categories
        </button>
      </footer>
    </div>
  );
}

export default ExampleCategoryPage;
