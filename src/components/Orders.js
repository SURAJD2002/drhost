

// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Orders.css';

// function Orders() {
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const withRetry = (fn, maxAttempts = 3, delay = 1000) => {
//     return async () => {
//       let attempt = 0;
//       while (attempt < maxAttempts) {
//         try {
//           return await fn();
//         } catch (error) {
//           attempt++;
//           if (attempt === maxAttempts) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
//         }
//       }
//     };
//   };

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         // Attempt to refresh the session if it’s expired
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('You must be logged in to view your orders.');
//           setLoading(false);
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       let query = supabase.from('orders').select('*, order_items(*, products(title, price, images))');
      
//       if (session.user.id) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (profileError) throw profileError;

//         if (profileData.is_seller) {
//           query = query.eq('seller_id', session.user.id);
//         } else {
//           query = query.eq('user_id', session.user.id);
//         }
//       }

//       const fetchOrdersQuery = () => query;
//       const ordersData = await withRetry(fetchOrdersQuery)();

//       const enrichedOrders = ordersData.data.map(order => ({
//         ...order,
//         order_items: order.order_items || [],
//       }));
//       setOrders(enrichedOrders);
//       console.log('Fetched orders with items:', enrichedOrders);
//       setError(null);
//     } catch (fetchError) {
//       console.error('Error fetching orders:', fetchError);
//       setError(`Error: ${fetchError.message || 'Failed to fetch orders. Please check your permissions or try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]); // Updated dependency array for fetchOrders

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]); // Updated dependency array for useEffect

//   const handleOrderClick = async (orderId) => {
//     try {
//       // Check and refresh session with detailed logging
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Current session before refresh:', session);
//       if (sessionError || !session?.user) {
//         // Attempt to refresh the session
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         console.log('Session refresh attempt:', { refreshData, refreshError });
//         if (refreshError || !refreshData.session?.user) {
//           console.error('Session refresh failed:', refreshError);
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       // Verify user has permission to access the order
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('user_id, seller_id')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116') { // Order not found
//           setError('Order not found.');
//         } else if (orderError.code === '42501') { // Permission denied
//           setError('You are not authorized to view this order.');
//         } else {
//           throw orderError;
//         }
//         return;
//       }

//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         return;
//       }

//       console.log('Navigating to order:', orderId, 'User ID:', session.user.id);
//       navigate(`/order-details/${orderId}`);
//     } catch (error) {
//       console.error('Error navigating to order:', error);
//       setError(`Error: ${error.message || 'Failed to navigate to order details. Please try again later.'}`);
//       if (error.message.includes('Authentication required') || error.code === '42501') {
//         navigate('/auth'); // Redirect to login if authentication fails
//       }
//     }
//   };

//   if (loading) return <div className="orders-loading">Loading...</div>;
//   if (error) return <div className="orders-error">{error}</div>;
//   if (orders.length === 0) return <div className="orders-empty">You have no orders yet.</div>;

//   return (
//     <div className="orders">
//       <h1 style={{ color: '#007bff' }}>My Orders</h1>
//       <div className="orders-list">
//         {orders.map((order) => (
//           <div 
//             key={order.id} 
//             className="order-item" 
//             onClick={() => handleOrderClick(order.id)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
//             <p style={{ color: '#666' }}>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location}</p>
//             <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address}</p>
//             <div className="order-items-list">
//               <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
//               {order.order_items.length > 0 ? (
//                 order.order_items.map((item) => (
//                   <p key={item.id} style={{ color: '#666' }}>
//                     {item.products.title} - Quantity: {item.quantity} - Price: ₹{item.products.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                 ))
//               ) : (
//                 <p style={{ color: '#666' }}>No products found for this order.</p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Orders;



// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Orders.css';

// function Orders() {
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const withRetry = (fn, maxAttempts = 3, delay = 1000) => {
//     return async () => {
//       let attempt = 0;
//       while (attempt < maxAttempts) {
//         try {
//           return await fn();
//         } catch (error) {
//           attempt++;
//           if (attempt === maxAttempts) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
//         }
//       }
//     };
//   };

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('You must be logged in to view your orders.');
//           setLoading(false);
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       let query = supabase.from('orders').select('*, order_items(*, products(title, price, images))');
      
//       if (session.user.id) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (profileError) throw profileError;

//         if (profileData.is_seller) {
//           query = query.eq('seller_id', session.user.id);
//         } else {
//           query = query.eq('user_id', session.user.id);
//         }
//       }

//       const fetchOrdersQuery = () => query;
//       const ordersData = await withRetry(fetchOrdersQuery)();

//       const enrichedOrders = ordersData.data.map(order => ({
//         ...order,
//         order_items: order.order_items || [],
//       }));
//       setOrders(enrichedOrders);
//       setError(null);
//     } catch (fetchError) {
//       console.error('Error fetching orders:', fetchError);
//       setError(`Error: ${fetchError.message || 'Failed to fetch orders. Please check your permissions or try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   const handleOrderClick = async (orderId) => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('*, order_items(*, products(title, price, images))')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116') {
//           setError('Order not found.');
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order.');
//         } else {
//           throw orderError;
//         }
//         return;
//       }

//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         return;
//       }

//       // Navigate with order data
//       navigate(`/order-details/${orderId}`, { state: { order: orderData } });
//     } catch (error) {
//       console.error('Error navigating to order:', error);
//       setError(`Error: ${error.message || 'Failed to navigate to order details. Please try again later.'}`);
//       if (error.message.includes('Authentication required') || error.code === '42501') {
//         navigate('/auth');
//       }
//     }
//   };

//   if (loading) return <div className="orders-loading">Loading...</div>;
//   if (error) return <div className="orders-error">{error}</div>;
//   if (orders.length === 0) return <div className="orders-empty">You have no orders yet.</div>;

//   return (
//     <div className="orders">
//       <h1 style={{ color: '#007bff' }}>My Orders</h1>
//       <div className="orders-list">
//         {orders.map((order) => (
//           <div 
//             key={order.id} 
//             className="order-item" 
//             onClick={() => handleOrderClick(order.id)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
//             <p style={{ color: '#666' }}>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location}</p>
//             <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address}</p>
//             <div className="order-items-list">
//               <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
//               {order.order_items.length > 0 ? (
//                 order.order_items.map((item) => (
//                   <p key={item.id} style={{ color: '#666' }}>
//                     {item.products.title} - Quantity: {item.quantity} - Price: ₹{item.products.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                 ))
//               ) : (
//                 <p style={{ color: '#666' }}>No products found for this order.</p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Orders;




// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Orders.css';

// function Orders() {
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const withRetry = (fn, maxAttempts = 3, delay = 1000) => {
//     return async () => {
//       let attempt = 0;
//       while (attempt < maxAttempts) {
//         try {
//           return await fn();
//         } catch (error) {
//           attempt++;
//           if (attempt === maxAttempts) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
//         }
//       }
//     };
//   };

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('You must be logged in to view your orders.');
//           setLoading(false);
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       let query = supabase
//         .from('orders')
//         .select(`
//           *,
//           emi_applications!orders_emi_application_uuid_fkey (
//             product_name,
//             product_price,
//             seller_name
//           ),
//           sellers (
//             store_name
//           )
//         `);

//       if (session.user.id) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (profileError) throw profileError;

//         if (profileData.is_seller) {
//           query = query.eq('seller_id', session.user.id);
//         } else {
//           query = query.eq('user_id', session.user.id);
//         }
//       }

//       const fetchOrdersQuery = () => query;
//       const ordersData = await withRetry(fetchOrdersQuery)();

//       setOrders(ordersData.data || []);
//       setError(null);
//     } catch (fetchError) {
//       console.error('Error fetching orders:', fetchError);
//       setError(`Error: ${fetchError.message || 'Failed to fetch orders. Please check your permissions or try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   const handleOrderClick = async (orderId) => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select(`
//           *,
//           emi_applications!orders_emi_application_uuid_fkey (
//             product_name,
//             product_price,
//             seller_name
//           ),
//           sellers (
//             store_name
//           )
//         `)
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116') {
//           setError('Order not found.');
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order.');
//         } else {
//           throw orderError;
//         }
//         return;
//       }

//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         return;
//       }

//       navigate(`/order-details/${orderId}`, { state: { order: orderData } });
//     } catch (error) {
//       console.error('Error navigating to order:', error);
//       setError(`Error: ${error.message || 'Failed to navigate to order details. Please try again later.'}`);
//       if (error.message.includes('Authentication required') || error.code === '42501') {
//         navigate('/auth');
//       }
//     }
//   };

//   if (loading) return <div className="orders-loading">Loading...</div>;
//   if (error) return <div className="orders-error">{error}</div>;
//   if (orders.length === 0) return <div className="orders-empty">You have no orders yet.</div>;

//   return (
//     <div className="orders">
//       <h1 style={{ color: '#007bff' }}>My Orders</h1>
//       <div className="orders-list">
//         {orders.map((order) => (
//           <div 
//             key={order.id} 
//             className="order-item" 
//             onClick={() => handleOrderClick(order.id)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
//             <p style={{ color: '#666' }}>
//               Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//             <div className="order-items-list">
//               <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
//               {order.emi_applications ? (
//                 <p style={{ color: '#666' }}>
//                   {order.emi_applications.product_name} - Price: ₹{order.emi_applications.product_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                 </p>
//               ) : (
//                 <p style={{ color: '#666' }}>Product details not available.</p>
//               )}
//             </div>
//             <p style={{ color: '#666' }}>
//               Seller: {order.emi_applications?.seller_name || order.sellers?.store_name || 'Unknown Seller'}
//             </p>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Orders;



// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Orders.css';

// function Orders() {
//   const [orders, setOrders] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const withRetry = (fn, maxAttempts = 3, delay = 1000) => {
//     return async () => {
//       let attempt = 0;
//       while (attempt < maxAttempts) {
//         try {
//           return await fn();
//         } catch (error) {
//           attempt++;
//           if (attempt === maxAttempts) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
//         }
//       }
//     };
//   };

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('You must be logged in to view your orders.');
//           setLoading(false);
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       let query = supabase
//         .from('orders')
//         .select(`
//           *,
//           emi_applications!orders_emi_application_uuid_fkey (
//             product_name,
//             product_price,
//             seller_name
//           ),
//           sellers (
//             store_name
//           )
//         `);

//       if (session.user.id) {
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (profileError) throw profileError;

//         if (profileData.is_seller) {
//           query = query.eq('seller_id', session.user.id);
//         } else {
//           query = query.eq('user_id', session.user.id);
//         }
//       }

//       const fetchOrdersQuery = () => query;
//       const ordersData = await withRetry(fetchOrdersQuery)();

//       setOrders(ordersData.data || []);
//       setError(null);
//     } catch (fetchError) {
//       console.error('Error fetching orders:', fetchError);
//       setError(`Error: ${fetchError.message || 'Failed to fetch orders. Please check your permissions or try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   const handleOrderClick = async (orderId) => {
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select(`
//           *,
//           emi_applications!orders_emi_application_uuid_fkey (
//             product_name,
//             product_price,
//             seller_name
//           ),
//           sellers (
//             store_name
//           )
//         `)
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116') {
//           setError('Order not found.');
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order.');
//         } else {
//           throw orderError;
//         }
//         return;
//       }

//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         return;
//       }

//       navigate(`/order-details/${orderId}`, { state: { order: orderData } });
//     } catch (error) {
//       console.error('Error navigating to order:', error);
//       setError(`Error: ${error.message || 'Failed to navigate to order details. Please try again later.'}`);
//       if (error.message.includes('Authentication required') || error.code === '42501') {
//         navigate('/auth');
//       }
//     }
//   };

//   if (loading) return <div className="orders-loading">Loading...</div>;
//   if (error) return <div className="orders-error">{error}</div>;
//   if (orders.length === 0) return <div className="orders-empty">You have no orders yet.</div>;

//   return (
//     <div className="orders">
//       <h1 style={{ color: '#007bff' }}>My Orders</h1>
//       <div className="orders-list">
//         {orders.map((order) => (
//           <div 
//             key={order.id} 
//             className="order-item" 
//             onClick={() => handleOrderClick(order.id)}
//             style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
//           >
//             <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
//             <p style={{ color: '#666' }}>
//               Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
//             <p style={{ color: '#666' }}>
//               Status: {order.order_status}
//               {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                 <span style={{ color: '#ff9800', marginLeft: '5px' }}>(Waiting for Approval)</span>
//               )}
//             </p>
//             {order.order_status === 'cancelled' && order.cancellation_reason && (
//               <p style={{ color: '#f44336' }}>Reason: {order.cancellation_reason}</p>
//             )}
//             <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//             <div className="order-items-list">
//               <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
//               {order.emi_applications ? (
//                 <p style={{ color: '#666' }}>
//                   {order.emi_applications.product_name} - Price: ₹{order.emi_applications.product_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                 </p>
//               ) : (
//                 <p style={{ color: '#666' }}>Product details not available.</p>
//               )}
//             </div>
//             <p style={{ color: '#666' }}>
//               Seller: {order.emi_applications?.seller_name || order.sellers?.store_name || 'Unknown Seller'}
//             </p>
//           </div>
//         ))}
//       </div>
//       <div className="footer" style={{ backgroundColor: '#f8f9fa', padding: '10px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
//         <div className="footer-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🏠
//           </span>
//           <span className="icon-circle" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Orders;



import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../style/Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const withRetry = (fn, maxAttempts = 3, delay = 1000) => {
    return async () => {
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          return await fn();
        } catch (error) {
          attempt++;
          if (attempt === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    };
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session?.user) {
          setError('You must be logged in to view your orders.');
          setLoading(false);
          navigate('/auth');
          return;
        }
        session = refreshData.session;
      }

      let query = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          seller_id,
          order_status,
          total,
          shipping_address,
          payment_method,
          created_at,
          cancellation_reason,
          emi_application_uuid,
          emi_applications!orders_emi_application_uuid_fkey (
            product_name,
            product_price,
            seller_name
          ),
          order_items (
            quantity,
            price,
            products (
              title,
              images
            )
          ),
          sellers (
            store_name
          )
        `);

      if (session.user.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData.is_seller) {
          query = query.eq('seller_id', session.user.id);
        } else {
          query = query.eq('user_id', session.user.id);
        }
      }

      const fetchOrdersQuery = () => query.order('created_at', { ascending: false });
      const ordersData = await withRetry(fetchOrdersQuery)();

      setOrders(ordersData.data || []);
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching orders:', fetchError);
      setError(`Error: ${fetchError.message || 'Failed to fetch orders. Please check your permissions or try again later.'}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderClick = async (orderId) => {
    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session?.user) {
          setError('Authentication required. Please ensure you are logged in.');
          navigate('/auth');
          return;
        }
        session = refreshData.session;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          emi_applications!orders_emi_application_uuid_fkey (
            product_name,
            product_price,
            seller_name
          ),
          order_items (
            quantity,
            price,
            products (
              title,
              images
            )
          ),
          sellers (
            store_name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          setError('Order not found.');
        } else if (orderError.code === '42501') {
          setError('You are not authorized to view this order.');
        } else {
          throw orderError;
        }
        return;
      }

      const isBuyer = orderData.user_id === session.user.id;
      const isSeller = orderData.seller_id === session.user.id;

      if (!isBuyer && !isSeller) {
        setError('You are not authorized to view this order.');
        return;
      }

      navigate(`/order-details/${orderId}`, { state: { order: orderData } });
    } catch (error) {
      console.error('Error navigating to order:', error);
      setError(`Error: ${error.message || 'Failed to navigate to order details. Please try again later.'}`);
      if (error.message.includes('Authentication required') || error.code === '42501') {
        navigate('/auth');
      }
    }
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
            style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}
          >
            <h3 style={{ color: '#007bff' }}>Order #{order.id}</h3>
            <p style={{ color: '#666' }}>
              Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
            <p style={{ color: '#666' }}>
              Status: {order.order_status}
              {order.payment_method === 'emi' && order.order_status === 'pending' && (
                <span style={{ color: '#ff9800', marginLeft: '5px' }}>(Waiting for Approval)</span>
              )}
            </p>
            {order.order_status === 'cancelled' && order.cancellation_reason && (
              <p style={{ color: '#f44336' }}>Reason: {order.cancellation_reason}</p>
            )}
            <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
            <div className="order-items-list">
              <h4 style={{ color: '#007bff' }}>Ordered Products</h4>
              {order.payment_method === 'emi' && order.emi_applications ? (
                <div className="order-item-details">
                  <img
                    src={'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
                    alt={order.emi_applications.product_name || 'Product'}
                    onError={(e) => {
                      e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    }}
                    style={{ width: '50px', height: '50px', marginRight: '10px' }}
                  />
                  <p style={{ color: '#666' }}>
                    {order.emi_applications.product_name} - Price: ₹{order.emi_applications.product_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ) : order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item, index) => (
                  <div key={index} className="order-item-details">
                    <img
                      src={item.products?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
                      alt={item.products?.title || `Product ${index + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                      }}
                      style={{ width: '50px', height: '50px', marginRight: '10px' }}
                    />
                    <p style={{ color: '#666' }}>
                      {item.products?.title || 'Unnamed Product'} - Qty: {item.quantity} - Price: ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666' }}>Product details not available.</p>
              )}
            </div>
            <p style={{ color: '#666' }}>
              Seller: {order.emi_applications?.seller_name || order.sellers?.store_name || 'Unknown Seller'}
            </p>
          </div>
        ))}
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

export default Orders;