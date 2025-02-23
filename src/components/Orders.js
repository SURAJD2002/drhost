import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaTruck } from 'react-icons/fa';
import '../style/Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }

      // Fetch orders based on user role (buyer or seller)
      let query = supabase.from('orders').select('*, order_items(*, products(name, price))');
      
      if (session.user.id) {
        // Check if the user is a seller
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData.is_seller) {
          // Seller: fetch orders where they are the seller
          query = query.eq('seller_id', session.user.id);
        } else {
          // Buyer: fetch orders where they are the user
          query = query.eq('user_id', session.user.id);
        }
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Ensure order_items are properly mapped
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        order_items: order.order_items || [],
      }));
      setOrders(enrichedOrders);
    } catch (fetchError) {
      console.error('Error fetching orders:', fetchError);
      setError(`Error: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  if (loading) return <div className="orders-loading">Loading...</div>;
  if (error) return <div className="orders-error">{error}</div>;
  if (orders.length === 0) return <div className="orders-empty">You have no orders yet.</div>;

  return (
    <div className="orders">
      <h1 style={{ color: '#007bff' }}>My Orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="order-item" 
            onClick={() => handleOrderClick(order.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
            <p style={{ color: '#666' }}>Total: ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
            <p style={{ color: '#666' }}>Status: {order.order_status}</p>
            <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location}</p>
            <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address}</p>
            <ul style={{ color: '#666' }}>
              {order.order_items.map((item) => (
                <li key={item.id}>
                  {item.products.name} - Quantity: {item.quantity} - Price: ₹{item.price_at_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;