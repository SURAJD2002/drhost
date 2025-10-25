import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useScrollPosition, useEnhancedNavigation } from '../hooks/scrollManager';

/**
 * Example ProductPage Component
 * Demonstrates perfect back navigation with scroll restoration
 */
function ExampleProductPage() {
  const { productId } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Initialize scroll management
  const { enhancedNavigate } = useEnhancedNavigation();
  useScrollPosition(); // Automatically manages scroll for current route
  
  // Ensure product page always starts from top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId]);

  // Mock product data
  const mockProducts = {
    101: {
      id: 101,
      name: 'iPhone 15 Pro',
      category: 'Electronics',
      price: 99999,
      originalPrice: 109999,
      discount: 10000,
      images: ['📱', '📱', '📱'],
      variants: [
        { id: 1, name: '128GB', color: 'Natural Titanium', price: 99999 },
        { id: 2, name: '256GB', color: 'Natural Titanium', price: 114999 },
        { id: 3, name: '512GB', color: 'Natural Titanium', price: 134999 }
      ],
      description: 'The iPhone 15 Pro features the A17 Pro chip, advanced camera system, and titanium design.',
      features: ['A17 Pro Chip', '48MP Camera', 'Titanium Build', 'USB-C'],
      rating: 4.8,
      reviews: 1250,
      inStock: true,
      seller: 'Apple Store Official'
    },
    201: {
      id: 201,
      name: 'Designer Handbag',
      category: 'Fashion',
      price: 25000,
      originalPrice: 35000,
      discount: 10000,
      images: ['👜', '👜', '👜'],
      variants: [
        { id: 1, name: 'Black', color: 'Black Leather', price: 25000 },
        { id: 2, name: 'Brown', color: 'Brown Leather', price: 25000 },
        { id: 3, name: 'Red', color: 'Red Leather', price: 26000 }
      ],
      description: 'Luxury designer handbag crafted from premium leather with elegant design.',
      features: ['Premium Leather', 'Spacious Interior', 'Gold Hardware', 'Authentic Brand'],
      rating: 4.6,
      reviews: 89,
      inStock: true,
      seller: 'Fashion Hub'
    },
    301: {
      id: 301,
      name: 'Gold Necklace',
      category: 'Jewellery',
      price: 45000,
      originalPrice: 55000,
      discount: 10000,
      images: ['📿', '📿', '📿'],
      variants: [
        { id: 1, name: '18K Gold', color: 'Yellow Gold', price: 45000 },
        { id: 2, name: '22K Gold', color: 'Yellow Gold', price: 55000 },
        { id: 3, name: 'White Gold', color: 'White Gold', price: 48000 }
      ],
      description: 'Elegant gold necklace with intricate design, perfect for special occasions.',
      features: ['Pure Gold', 'Handcrafted', 'Hallmarked', 'Gift Box Included'],
      rating: 4.9,
      reviews: 156,
      inStock: true,
      seller: 'Gold Palace'
    }
  };

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const productData = mockProducts[productId];
      if (productData) {
        setProduct(productData);
      }
      
      setLoading(false);
    };

    loadProduct();
  }, [productId, mockProducts]);

  // Handle back navigation with intelligent routing
  const handleBackClick = () => {
    const state = location.state;
    
    // If user came from a specific category, go back to that category
    if (state?.fromCategory && state?.categorySlug) {
      enhancedNavigate(`/category/${state.categorySlug}`, {
        state: {
          fromProduct: true,
          productId: productId,
          productName: state.productName,
          restoreScroll: true,
          scrollPosition: state.scrollPosition || 0
        }
      });
    } 
    // If user came from home, go back to home
    else if (state?.fromHome) {
      enhancedNavigate('/', {
        state: {
          fromProduct: true,
          productId: productId,
          productName: state.productName,
          restoreScroll: true,
          scrollPosition: state.homeScrollPosition || 0
        }
      });
    }
    // If user opened product directly, go to home as fallback
    else {
      enhancedNavigate('/', {
        state: {
          fromProduct: true,
          productId: productId,
          navigationType: 'fallback'
        }
      });
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // Simulate add to cart
    console.log('Added to cart:', {
      productId: product.id,
      variant: product.variants[selectedVariant],
      quantity
    });
  };

  // Handle buy now
  const handleBuyNow = () => {
    // Simulate buy now
    console.log('Buy now:', {
      productId: product.id,
      variant: product.variants[selectedVariant],
      quantity
    });
  };

  if (loading) {
    return (
      <div className="product-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page error">
        <div className="error-container">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <button onClick={handleBackClick} className="back-button">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedVariantData = product.variants[selectedVariant];
  const finalPrice = selectedVariantData.price;
  const savings = product.originalPrice - finalPrice;

  return (
    <div className="product-page">
      {/* Header */}
      <header className="product-header">
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label="Go back to previous page"
        >
          ← Back
        </button>
        <h1 className="product-title">{product.name}</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="product-content">
        {/* Product Images */}
        <section className="product-images">
          <div className="main-image">
            <div className="image-placeholder">
              {product.images[selectedImage]}
            </div>
          </div>
          <div className="image-thumbnails">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
                aria-label={`View image ${index + 1}`}
              >
                {image}
              </button>
            ))}
          </div>
        </section>

        {/* Product Details */}
        <section className="product-details">
          <div className="product-header-info">
            <h2 className="product-name">{product.name}</h2>
            <div className="product-rating">
              <div className="stars">
                {'★'.repeat(Math.floor(product.rating))}
                {'☆'.repeat(5 - Math.floor(product.rating))}
              </div>
              <span className="rating-text">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>

          <div className="product-pricing">
            <div className="price-row">
              <span className="current-price">₹{finalPrice.toLocaleString()}</span>
              {product.originalPrice > finalPrice && (
                <>
                  <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="discount-badge">Save ₹{savings.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          {/* Variant Selection */}
          <div className="variant-selection">
            <h3>Select Variant</h3>
            <div className="variants-grid">
              {product.variants.map((variant, index) => (
                <button
                  key={variant.id}
                  className={`variant-option ${selectedVariant === index ? 'selected' : ''}`}
                  onClick={() => setSelectedVariant(index)}
                >
                  <div className="variant-name">{variant.name}</div>
                  <div className="variant-color">{variant.color}</div>
                  <div className="variant-price">₹{variant.price.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="quantity-selection">
            <h3>Quantity</h3>
            <div className="quantity-controls">
              <button 
                className="quantity-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Product Features */}
          <div className="product-features">
            <h3>Key Features</h3>
            <ul className="features-list">
              {product.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Seller Info */}
          <div className="seller-info">
            <h3>Sold by</h3>
            <div className="seller-details">
              <span className="seller-name">{product.seller}</span>
              <span className="seller-badge">Verified Seller</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button 
              className="buy-now-btn"
              onClick={handleBuyNow}
              disabled={!product.inStock}
            >
              Buy Now
            </button>
          </div>
        </section>
      </main>

      {/* Additional Sections */}
      <section className="product-extras">
        <div className="delivery-info">
          <h3>🚚 Delivery Information</h3>
          <ul>
            <li>Free delivery on orders above ₹500</li>
            <li>Same-day delivery in select areas</li>
            <li>30-day return policy</li>
            <li>Secure packaging guaranteed</li>
          </ul>
        </div>

        <div className="customer-reviews">
          <h3>⭐ Customer Reviews</h3>
          <div className="reviews-summary">
            <div className="rating-breakdown">
              <div className="rating-bar">
                <span>5★</span>
                <div className="bar"><div className="fill" style={{width: '70%'}}></div></div>
                <span>70%</span>
              </div>
              <div className="rating-bar">
                <span>4★</span>
                <div className="bar"><div className="fill" style={{width: '20%'}}></div></div>
                <span>20%</span>
              </div>
              <div className="rating-bar">
                <span>3★</span>
                <div className="bar"><div className="fill" style={{width: '7%'}}></div></div>
                <span>7%</span>
              </div>
              <div className="rating-bar">
                <span>2★</span>
                <div className="bar"><div className="fill" style={{width: '2%'}}></div></div>
                <span>2%</span>
              </div>
              <div className="rating-bar">
                <span>1★</span>
                <div className="bar"><div className="fill" style={{width: '1%'}}></div></div>
                <span>1%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="product-footer">
        <p>Continue shopping and discover more amazing products!</p>
      </footer>
    </div>
  );
}

export default ExampleProductPage;
