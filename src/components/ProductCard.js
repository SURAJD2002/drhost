// src/components/ProductCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_IMAGE = 'https://dummyimage.com/150';

const ProductCard = ({ product, addToCart, handleBuyNow, categoryId, categoryName }) => {
  const navigate = useNavigate();

  const normalizedProduct = {
    id: product.id,
    name: product.name || product.title || 'Unnamed Product',
    images: Array.isArray(product.images) ? product.images : [],
    displayPrice: product.offer_price || product.price || 0,
    displayOriginalPrice: product.original_price || null,
    discountAmount: product.discountAmount || (product.original_price && product.offer_price ? product.original_price - product.offer_price : 0),
    stock: product.stock || 0,
    deliveryRadius: product.deliveryRadiusKm || product.delivery_radius_km || 50,
    variants: Array.isArray(product.variants) ? product.variants : [],
  };

  return (
    <div
      className="prod-item"
      onClick={() => {
        navigate(`/product/${product.id}`, {
          state: {
            fromCategory: !!categoryId,
            categoryId: categoryId || product.categoryId,
            categoryName: categoryName || null,
            scrollPosition: window.scrollY,
          },
        });
      }}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          navigate(`/product/${product.id}`, {
            state: {
              fromCategory: !!categoryId,
              categoryId: categoryId || product.categoryId,
              categoryName: categoryName || null,
              scrollPosition: window.scrollY,
            },
          });
        }
      }}
      aria-label={`View product ${normalizedProduct.name}`}
    >
      <div className="prod-image-wrapper">
        {normalizedProduct.discountAmount > 0 && (
          <span className="offer-badge">
            <span className="offer-label">Offer!</span>
            Save ₹{normalizedProduct.discountAmount.toFixed(2)}
          </span>
        )}
        <img
          src={normalizedProduct.images[0] || DEFAULT_IMAGE}
          alt={normalizedProduct.name}
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE;
          }}
          loading="lazy"
        />
      </div>
      <h3 className="prod-item-name">{normalizedProduct.name}</h3>
      <div className="prod-price-section">
        <p className="prod-price">
          ₹{normalizedProduct.displayPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {normalizedProduct.displayOriginalPrice && normalizedProduct.displayOriginalPrice > normalizedProduct.displayPrice && (
          <p className="prod-original-price">
            ₹{normalizedProduct.displayOriginalPrice.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
      </div>
      <p className="prod-item-radius">Delivery Radius: {normalizedProduct.deliveryRadius} km</p>
      <div className="prod-item-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="prod-add-cart-btn"
          disabled={normalizedProduct.stock <= 0 || (normalizedProduct.variants.length > 0 && normalizedProduct.variants.every((v) => v.stock <= 0))}
          aria-label={`Add ${normalizedProduct.name} to cart`}
        >
          {normalizedProduct.stock <= 0 || (normalizedProduct.variants.length > 0 && normalizedProduct.variants.every((v) => v.stock <= 0))
            ? 'Out of Stock'
            : 'Add to Cart'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBuyNow(product);
          }}
          className="prod-buy-now-btn"
          disabled={normalizedProduct.stock <= 0 || (normalizedProduct.variants.length > 0 && normalizedProduct.variants.every((v) => v.stock <= 0))}
          aria-label={`Buy ${normalizedProduct.name} now`}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;