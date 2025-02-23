import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/OrderDetails.css';

function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name, price)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (fetchError) {
      console.error('Error fetching order details:', fetchError);
      setError(`Error: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="order-details-loading">Loading...</div>;
  if (error) return <div className="order-details-error">{error}</div>;
  if (!order) return <div className="order-details-error">Order not found.</div>;

  return (
    <div className="order-details">
      <div className="order-details-header">
        <h1>ORDER DETAILS</h1>
        <a href="/help" className="help-link">HELP</a>
      </div>

      <div className="order-card">
        <div className="order-item">
          <img src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} alt={orderItems[0]?.products?.name || 'Product'} className="order-image" />
          <div className="order-info">
            <h2>Order #{order.id}</h2>
            <p>{orderItems[0]?.products?.name || 'No product name'} - IND-9</p>
            <p>Payment Method: {order.payment_method || 'Cash'} ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p>All issue easy returns</p>
          </div>
          <span className="chevron"></span>
        </div>
      </div>

      <div className="order-status">
        <h3>Order Placed</h3>
        <p>Delivery by Tue, 04 Mar</p>
        <div className="status-timeline">
          <span className="status-step active">Ordered<br />23 Feb</span>
          <span className="status-step active">Shipped<br />25 Feb</span>
          <span className="status-step">Out for Delivery<br />04 Mar</span>
          <span className="status-step">Delivery<br />04 Mar</span>
        </div>
        <p className="shipping-soon">Shipping Soon!</p>
        <p>Cancellation available till shipping!</p>
        <button className="cancel-button">Cancel Order</button>
      </div>

      <div className="delivery-address">
        <h3>Delivery Address</h3>
        <p>Raghu Kumar</p>
        <p>Raghunathpura bus stop near sbi atm bengaluru rural, Near sbi atm, Raghunathpura, Karnataka - 562163</p>
        <p>8825287284</p>
        <button className="change-button">CHANGE</button>
      </div>

      <div className="recently-viewed">
        <h3>Recently Viewed</h3>
        <div className="recent-items">
          <div className="recent-item">
            <img src="https://dummyimage.com/100" alt="Shirts" className="recent-image" />
            <p>Shirts</p>
          </div>
          <div className="recent-item">
            <img src="https://dummyimage.com/100" alt="Orthopedic & Diabetic Slippers" className="recent-image" />
            <p>Orthopedic & Diabetic Slippers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;