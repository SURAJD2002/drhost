import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import '../style/ModernOrderDetails.css';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: '#facc15', bg: '#fef3c7', text: '#92400e' },
      shipped: { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
      'out for delivery': { color: '#fb923c', bg: '#fed7aa', text: '#c2410c' },
      delivered: { color: '#22c55e', bg: '#dcfce7', text: '#166534' },
      cancelled: { color: '#ef4444', bg: '#fee2e2', text: '#991b1b' }
    };
    return configs[status.toLowerCase()] || configs.pending;
  };

  const config = getStatusConfig(status);
  
  return (
    <span 
      className="status-badge"
      style={{ 
        backgroundColor: config.bg, 
        color: config.text,
        border: `1px solid ${config.color}`
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Timeline Component
const Timeline = ({ order, currentStep }) => {
  const steps = [
    { id: 'ordered', icon: '🧾', label: 'Ordered', date: order?.created_at },
    { id: 'shipped', icon: '🚚', label: 'Shipped', date: order?.shipped_at },
    { id: 'out_for_delivery', icon: '🛺', label: 'Out for Delivery', date: order?.out_for_delivery_at },
    { id: 'delivered', icon: '🏠', label: 'Delivered', date: order?.delivered_at },
    { id: 'cancelled', icon: '❌', label: 'Cancelled', date: order?.cancelled_at }
  ];

  const getStepIndex = (stepId) => {
    const statusMap = {
      'pending': 0,
      'shipped': 1,
      'out for delivery': 2,
      'delivered': 3,
      'cancelled': 4
    };
    return statusMap[order?.status?.toLowerCase()] || 0;
  };

  const currentStepIndex = getStepIndex(order?.status);

  return (
    <div className="timeline-container">
      <div className="timeline">
        {steps.slice(0, order?.status?.toLowerCase() === 'cancelled' ? 5 : 4).map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="timeline-icon">
                <span className="step-icon">{step.icon}</span>
              </div>
              <div className="timeline-content">
                <div className="step-label">{step.label}</div>
                {step.date && (
                  <div className="step-date">
                    {new Date(step.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`timeline-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={() => !readOnly && onRatingChange(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Cancel Order Modal
const CancelOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  
  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
      setReason('');
      onClose();
    } else {
      toast.error('Please provide a cancellation reason');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cancel Order</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Please provide a reason for cancelling this order:</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter cancellation reason..."
            rows={4}
            className="cancel-reason-input"
          />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={handleSubmit}>Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
};

function ModernOrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isSeller] = useState(false); // TODO: Implement seller detection logic
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState('');

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              price,
              original_price,
              discount_amount,
              sellers (
                id,
                store_name
              )
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);
      setStatusDropdown(orderData.status);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!orderId) return;
    
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [orderId]);

  // Update order status (for sellers)
  const updateOrderStatus = async () => {
    if (!statusDropdown || !isSeller) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: statusDropdown })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrder(prev => ({ ...prev, status: statusDropdown }));
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Cancel order
  const cancelOrder = async (reason) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrder(prev => ({ 
        ...prev, 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      }));
      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  // Submit review
  const submitReview = async () => {
    if (!newReview.rating || !newReview.review_text.trim()) {
      toast.error('Please provide both rating and review text');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          product_id: order.order_items[0]?.product_id,
          rating: newReview.rating,
          review_text: newReview.review_text
        });

      if (error) throw error;
      
      setNewReview({ rating: 0, review_text: '' });
      fetchReviews();
      toast.success('Review submitted successfully');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  useEffect(() => {
    if (!location.state?.order) {
      fetchOrderDetails();
    }
    fetchReviews();
  }, [fetchOrderDetails, fetchReviews, location.state?.order]);

  if (loading) {
    return (
      <div className="modern-order-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="modern-order-details">
        <div className="error-container">
          <p>{error || 'Order not found'}</p>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-order-details">
      <Helmet>
        <title>Order #{order.id} - Markeet</title>
        <meta name="description" content={`Order details for order #${order.id}`} />
      </Helmet>

      {/* Header Section */}
      <div className="order-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="order-title">Order #{order.id}</h1>
        <button 
          className="help-button"
          aria-label="Get help"
        >
          ℹ️
        </button>
      </div>

      <div className="order-content">
        {/* Order Summary Card */}
        <div className="card order-summary-card">
          <div className="card-header">
            <h2>🧾 Order Summary</h2>
            <StatusBadge status={order.status} />
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">💳 Ordered on</span>
              <span className="summary-value">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">💳 Payment Method</span>
              <span className="summary-value">{order.payment_method || 'Credit Card'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">💰 Total Amount</span>
              <span className="summary-value">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">📅 Estimated Delivery</span>
              <span className="summary-value">
                {order.estimated_delivery ? 
                  new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 
                  'Not specified'
                }
              </span>
            </div>
            {order.cancellation_reason && (
              <div className="summary-item cancellation-reason">
                <span className="summary-label">❌ Cancellation Reason</span>
                <span className="summary-value">{order.cancellation_reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Card */}
        <div className="card product-card">
          <div className="card-header">
            <h2>📦 Product Details</h2>
          </div>
          {order.order_items?.map((item, index) => (
            <div key={index} className="product-item">
              <div className="product-image">
                <img 
                  src={item.products?.images?.[0] || 'https://dummyimage.com/100x100/ccc/fff&text=No+Image'} 
                  alt={item.products?.name}
                  onError={(e) => e.target.src = 'https://dummyimage.com/100x100/ccc/fff&text=No+Image'}
                />
              </div>
              <div className="product-details">
                <h3 className="product-title">{item.products?.name}</h3>
                <div className="product-meta">
                  <span className="product-quantity">Quantity: {item.quantity}</span>
                  {item.variant && <span className="product-variant">Variant: {item.variant}</span>}
                </div>
                <div className="product-price">₹{item.price?.toFixed(2)}</div>
                <div className="product-seller">
                  Sold by: {item.products?.sellers?.store_name || 'Unknown Seller'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Card */}
        <div className="card timeline-card">
          <div className="card-header">
            <h2>🚚 Order Tracking</h2>
          </div>
          <Timeline order={order} />
        </div>

        {/* Actions Card */}
        <div className="card actions-card">
          <div className="card-header">
            <h2>⚡ Actions</h2>
          </div>
          <div className="actions-content">
            {isSeller ? (
              <div className="seller-actions">
                <div className="status-update">
                  <select 
                    value={statusDropdown}
                    onChange={(e) => setStatusDropdown(e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="out for delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button 
                    className="btn-success"
                    onClick={updateOrderStatus}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="buyer-actions">
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button 
                    className="btn-danger"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Card */}
        <div className="card reviews-card">
          <div className="card-header">
            <h2>⭐ Reviews</h2>
          </div>
          <div className="reviews-content">
            {reviews.length > 0 ? (
              <div className="existing-reviews">
                {reviews.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">{review.profiles?.name || 'Anonymous'}</span>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-rating">
                      <StarRating rating={review.rating} readOnly />
                    </div>
                    <div className="review-text">{review.review_text}</div>
                    {review.reply && (
                      <div className="review-reply">
                        <strong>Seller Reply:</strong> {review.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet.</p>
            )}
            
            {order.status === 'delivered' && (
              <div className="new-review">
                <h3>Write a Review</h3>
                <div className="review-rating-input">
                  <StarRating 
                    rating={newReview.rating} 
                    onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                  />
                </div>
                <textarea
                  value={newReview.review_text}
                  onChange={(e) => setNewReview(prev => ({ ...prev, review_text: e.target.value }))}
                  placeholder="Share your experience with this product..."
                  className="review-textarea"
                  rows={4}
                />
                <button 
                  className="btn-primary"
                  onClick={submitReview}
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address Card */}
        <div className="card address-card">
          <div className="card-header">
            <h2>📍 Delivery Address</h2>
          </div>
          <div className="address-content">
            <div className="address-text">
              {order.delivery_address ? (
                <div className="formatted-address">
                  <div className="address-line">{order.delivery_address.name}</div>
                  <div className="address-line">{order.delivery_address.address}</div>
                  {order.delivery_address.address2 && (
                    <div className="address-line">{order.delivery_address.address2}</div>
                  )}
                  <div className="address-line">
                    {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}
                  </div>
                  <div className="address-line">Phone: {order.delivery_address.phone}</div>
                </div>
              ) : (
                <p>No delivery address provided</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSubmit={cancelOrder}
      />
    </div>
  );
}

export default ModernOrderDetails;
