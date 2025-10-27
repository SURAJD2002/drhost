import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/OrderDetailsDemo.css';

// Demo data for showcasing the modern Order Details UI
const demoOrderData = {
  id: '12345',
  status: 'out for delivery',
  created_at: '2024-01-15T10:30:00Z',
  shipped_at: '2024-01-16T14:20:00Z',
  out_for_delivery_at: '2024-01-17T09:15:00Z',
  estimated_delivery: '2024-01-17T18:00:00Z',
  payment_method: 'Credit Card',
  total_amount: 1299.99,
  delivery_address: {
    name: 'John Doe',
    address: '123 Main Street, Apartment 4B',
    address2: 'Near Central Park',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    phone: '+1 (555) 123-4567'
  },
  order_items: [
    {
      id: 1,
      quantity: 2,
      price: 649.99,
      variant: 'Blue, Large',
      products: {
        id: 101,
        name: 'Premium Wireless Headphones',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'],
        price: 649.99,
        original_price: 799.99,
        discount_amount: 150.00,
        sellers: {
          store_name: 'TechStore Pro'
        }
      }
    },
    {
      id: 2,
      quantity: 1,
      price: 599.99,
      variant: 'Silver',
      products: {
        id: 102,
        name: 'Smart Fitness Watch',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'],
        price: 599.99,
        original_price: 599.99,
        discount_amount: 0,
        sellers: {
          store_name: 'Fitness Gear Hub'
        }
      }
    }
  ]
};

function OrderDetailsDemo() {
  const navigate = useNavigate();

  const handleViewDemo = () => {
    // Navigate to the modern order details page with demo data
    navigate(`/modern-order-details/${demoOrderData.id}`, {
      state: { order: demoOrderData }
    });
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>🎨 Modern Order Details UI Demo</h1>
        <p>A showcase of the new modern, minimal Order Details page design</p>
      </div>

      <div className="demo-features">
        <h2>✨ Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Modern Design</h3>
            <p>Clean, minimal interface with card-based layout and soft shadows</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Responsive</h3>
            <p>Horizontal timeline on desktop, vertical on mobile with smooth transitions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Status Tracking</h3>
            <p>Color-coded status badges and animated timeline with progress indicators</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Interactive</h3>
            <p>Smooth animations, hover effects, and modal interactions</p>
          </div>
        </div>
      </div>

      <div className="demo-preview">
        <h2>📋 Demo Order Preview</h2>
        <div className="preview-card">
          <div className="preview-header">
            <h3>Order #{demoOrderData.id}</h3>
            <span className={`status-badge status-${demoOrderData.status.replace(' ', '-')}`}>
              {demoOrderData.status}
            </span>
          </div>
          <div className="preview-details">
            <div className="preview-item">
              <span className="label">📅 Ordered:</span>
              <span className="value">
                {new Date(demoOrderData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="preview-item">
              <span className="label">💰 Total:</span>
              <span className="value">₹{demoOrderData.total_amount.toFixed(2)}</span>
            </div>
            <div className="preview-item">
              <span className="label">📦 Items:</span>
              <span className="value">{demoOrderData.order_items.length} product(s)</span>
            </div>
          </div>
          <button className="demo-button" onClick={handleViewDemo}>
            🚀 View Full Demo
          </button>
        </div>
      </div>

      <div className="demo-colors">
        <h2>🎨 Color Palette</h2>
        <div className="colors-grid">
          <div className="color-item">
            <div className="color-swatch" style={{ backgroundColor: '#facc15' }}></div>
            <span>Pending</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Shipped</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ backgroundColor: '#fb923c' }}></div>
            <span>Out for Delivery</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Delivered</span>
          </div>
          <div className="color-item">
            <div className="color-swatch" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      <div className="demo-actions">
        <button className="demo-button primary" onClick={handleViewDemo}>
          🎯 Launch Demo
        </button>
        <button className="demo-button secondary" onClick={() => navigate('/orders')}>
          📋 Back to Orders
        </button>
      </div>
    </div>
  );
}

export default OrderDetailsDemo;





