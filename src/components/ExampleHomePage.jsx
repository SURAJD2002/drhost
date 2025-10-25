import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollPosition, useEnhancedNavigation } from '../hooks/scrollManager';

/**
 * Example HomePage Component
 * Demonstrates scroll management for the home page
 */
function ExampleHomePage() {
  const location = useLocation();
  const [categories] = useState([
    { id: 1, name: 'Electronics', slug: 'electronics' },
    { id: 2, name: 'Fashion', slug: 'fashion' },
    { id: 3, name: 'Jewellery', slug: 'jewellery' },
    { id: 4, name: 'Home & Garden', slug: 'home-garden' },
    { id: 5, name: 'Sports', slug: 'sports' },
    { id: 6, name: 'Books', slug: 'books' }
  ]);

  const [products] = useState([
    { id: 1, name: 'iPhone 15 Pro', category: 'electronics' },
    { id: 2, name: 'Designer Handbag', category: 'fashion' },
    { id: 3, name: 'Gold Necklace', category: 'jewellery' },
    { id: 4, name: 'Garden Tools Set', category: 'home-garden' },
    { id: 5, name: 'Running Shoes', category: 'sports' },
    { id: 6, name: 'Programming Book', category: 'books' }
  ]);

  // Initialize scroll management
  const { enhancedNavigate } = useEnhancedNavigation();
  useScrollPosition(); // Automatically manages scroll for current route
  
  // Handle scroll restoration when coming back from product page
  useEffect(() => {
    const state = location.state;
    if (state?.fromProduct && state?.restoreScroll && state?.scrollPosition) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({ top: state.scrollPosition, behavior: 'auto' });
      }, 100);
    }
  }, [location.state]);

  // Handle category navigation
  const handleCategoryClick = (category) => {
    enhancedNavigate(`/category/${category.slug}`, {
      state: {
        fromHome: true,
        categoryName: category.name,
        categoryId: category.id
      }
    });
  };

  // Handle product navigation
  const handleProductClick = (product) => {
    enhancedNavigate(`/product/${product.id}`, {
      state: {
        fromHome: true,
        productName: product.name,
        category: product.category,
        homeScrollPosition: window.scrollY // Save current scroll position on home page
      }
    });
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>🛍️ Markeet - Your Premium Shopping Destination</h1>
        <p>Discover amazing products across all categories</p>
      </header>

      <main className="home-content">
        {/* Featured Categories Section */}
        <section className="categories-section">
          <h2>🏷️ Shop by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleCategoryClick(category)}
                aria-label={`Browse ${category.name} products`}
              >
                <div className="category-icon">
                  {category.slug === 'electronics' && '📱'}
                  {category.slug === 'fashion' && '👗'}
                  {category.slug === 'jewellery' && '💍'}
                  {category.slug === 'home-garden' && '🏠'}
                  {category.slug === 'sports' && '⚽'}
                  {category.slug === 'books' && '📚'}
                </div>
                <h3>{category.name}</h3>
                <p>Explore our collection</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="products-section">
          <h2>⭐ Featured Products</h2>
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
                  <div className="placeholder-image">
                    {product.category === 'electronics' && '📱'}
                    {product.category === 'fashion' && '👗'}
                    {product.category === 'jewellery' && '💍'}
                    {product.category === 'home-garden' && '🏠'}
                    {product.category === 'sports' && '⚽'}
                    {product.category === 'books' && '📚'}
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">₹{(Math.random() * 50000 + 1000).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Content to Enable Scrolling */}
        <section className="additional-content">
          <h2>🌟 Why Choose Markeet?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🚚 Fast Delivery</h3>
              <p>Get your orders delivered within 24-48 hours</p>
            </div>
            <div className="feature-card">
              <h3>💳 Secure Payment</h3>
              <p>100% secure payment processing with SSL encryption</p>
            </div>
            <div className="feature-card">
              <h3>🔄 Easy Returns</h3>
              <p>30-day return policy with no questions asked</p>
            </div>
            <div className="feature-card">
              <h3>⭐ Quality Assurance</h3>
              <p>All products verified for quality and authenticity</p>
            </div>
          </div>
        </section>

        <section className="newsletter-section">
          <h2>📧 Stay Updated</h2>
          <p>Subscribe to our newsletter for exclusive deals and new arrivals</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button type="button">Subscribe</button>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 Markeet. All rights reserved.</p>
        <p>Built with ❤️ for the best shopping experience</p>
      </footer>
    </div>
  );
}

export default ExampleHomePage;
