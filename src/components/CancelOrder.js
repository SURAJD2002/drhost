import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/Orders.css'; // Use Orders.css for consistency

function CancelOrder() {
  const { id } = useParams(); // Get order ID from URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // No initial fetch needed, but ensure session is valid
    const checkSession = async () => {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        navigate('/auth');
        return;
      }
    };
    checkSession();
  }, [navigate]);

  const cancelOrder = async (reason) => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        navigate('/auth');
        return;
      }

      const userId = session.data.session.user.id;
      // Fetch order with order_items and related products
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('user_id, seller_id, order_items(*, products(title, price, images, seller_id))')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      const isBuyer = orderData.user_id === userId;
      const isSeller = orderData.seller_id === userId;

      if (!isBuyer && !isSeller) {
        setError('You are not authorized to cancel this order.');
        return;
      }

      // Update order status and reason in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'cancelled', cancel_reason: reason })
        .eq('id', id);

      if (error) throw error;

      // Update related products in the order (set status to 'cancelled' and store reason)
      const orderItems = orderData.order_items || []; // Default to empty array if null/undefined
      if (!Array.isArray(orderItems)) {
        console.warn('order_items is not an array, skipping product updates:', orderItems);
      } else {
        for (const item of orderItems) {
          if (item && item.product_id) { // Ensure item and product_id exist
            const { error: productError } = await supabase
              .from('products')
              .update({ status: 'cancelled', cancel_reason: reason })
              .eq('id', item.product_id)
              .eq('seller_id', orderData.seller_id);

            if (productError) {
              console.error('Error updating product status:', productError);
              // Optionally, handle partial failure (e.g., log but continue)
            }
          } else {
            console.warn('Invalid order item, skipping:', item);
          }
        }
      }

      setMessage('Order cancelled successfully!');
      setTimeout(() => navigate('/orders'), 2000); // Redirect to orders after 2 seconds
    } catch (cancelErr) {
      console.error('Error cancelling order:', cancelErr);
      setError(`Error: ${cancelErr.message || 'Failed to cancel order. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orders">
      <h1 style={{ color: '#007bff' }}>Cancel Order #{id}</h1>
      {message && <p style={{ color: '#007bff' }}>{message}</p>}
      {error && <p style={{ color: '#ff0000' }}>{error}</p>}
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', margin: '20px auto', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: '#007bff' }}>Cancel Order</h2>
        <p style={{ color: '#666' }}>Why do you want to cancel this order?</p>
        <select
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666', width: '100%' }}
        >
          <option value="">Select a Reason</option>
          <option value="Changed my mind">Changed my mind</option>
          <option value="Found a better price">Found a better price</option>
          <option value="No longer needed">No longer needed</option>
          <option value="Other">Other (specify below)</option>
        </select>
        {cancelReason === 'Other' && (
          <input
            type="text"
            value={cancelReason === 'Other' ? cancelReason : ''}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter your reason"
            style={{ padding: '8px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666', width: '100%' }}
          />
        )}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button 
            onClick={() => cancelOrder(cancelReason)} 
            disabled={!cancelReason || loading} 
            className="submit-btn" 
            style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 20px', borderRadius: '5px' }}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
          <button 
            onClick={() => navigate('/orders')} 
            disabled={loading} 
            className="cancel-btn" 
            style={{ backgroundColor: '#ff4444', color: 'white', padding: '10px 20px', borderRadius: '5px', marginLeft: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
        <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🏠
          </span>
          <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            🛒
          </span>
        </div>
        <p style={{ color: '#007bff' }}>Categories</p>
      </div>
    </div>
  );
}

export default CancelOrder;