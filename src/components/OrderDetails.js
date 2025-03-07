// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchOrderDetails();
//   }, [orderId]);

//   const fetchOrderDetails = async () => {
//     setLoading(true);
//     try {
//       // Fetch order details
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('*')
//         .eq('id', orderId)
//         .single();

//       if (orderError) throw orderError;

//       // Fetch order items
//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(name, price)')
//         .eq('order_id', orderId);

//       if (itemsError) throw itemsError;

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-error">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1>ORDER DETAILS</h1>
//         <a href="/help" className="help-link">HELP</a>
//       </div>

//       <div className="order-card">
//         <div className="order-item">
//           <img src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} alt={orderItems[0]?.products?.name || 'Product'} className="order-image" />
//           <div className="order-info">
//             <h2>Order #{order.id}</h2>
//             <p>{orderItems[0]?.products?.name || 'No product name'} - IND-9</p>
//             <p>Payment Method: {order.payment_method || 'Cash'} ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//           <span className="chevron"></span>
//         </div>
//       </div>

//       <div className="order-status">
//         <h3>Order Placed</h3>
//         <p>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline">
//           <span className="status-step active">Ordered<br />23 Feb</span>
//           <span className="status-step active">Shipped<br />25 Feb</span>
//           <span className="status-step">Out for Delivery<br />04 Mar</span>
//           <span className="status-step">Delivery<br />04 Mar</span>
//         </div>
//         <p className="shipping-soon">Shipping Soon!</p>
//         <p>Cancellation available till shipping!</p>
//         <button className="cancel-button">Cancel Order</button>
//       </div>

//       <div className="delivery-address">
//         <h3>Delivery Address</h3>
//         <p>Raghu Kumar</p>
//         <p>Raghunathpura bus stop near sbi atm bengaluru rural, Near sbi atm, Raghunathpura, Karnataka - 562163</p>
//         <p>8825287284</p>
//         <button className="change-button">CHANGE</button>
//       </div>

//       <div className="recently-viewed">
//         <h3>Recently Viewed</h3>
//         <div className="recent-items">
//           <div className="recent-item">
//             <img src="https://dummyimage.com/100" alt="Shirts" className="recent-image" />
//             <p>Shirts</p>
//           </div>
//           <div className="recent-item">
//             <img src="https://dummyimage.com/100" alt="Orthopedic & Diabetic Slippers" className="recent-image" />
//             <p>Orthopedic & Diabetic Slippers</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchOrderDetails();
//   }, [orderId]);

//   const fetchOrderDetails = async () => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in to view order details.');
//         setLoading(false);
//         return;
//       }

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('id, user_id, seller_id, order_status, total, total_amount, payment_method, shipping_address, shipping_location, created_at, updated_at')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//           console.log(`Order ID ${orderId} does not exist in the orders table or is not accessible.`);
//         } else {
//           throw orderError;
//         }
//         setLoading(false);
//         return;
//       }

//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(name, price, images)')
//         .eq('order_id', orderId);

//       if (itemsError) throw itemsError;

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//       console.log(`Fetched order ID: ${orderData.id}, Order Items:`, itemsData);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled' })
//         .eq('id', orderId);

//       if (error) throw error;

//       setOrder({ ...order, order_status: 'Cancelled' });
//       alert('Order has been cancelled successfully.');
//     } catch (cancelError) {
//       console.error('Error cancelling order:', cancelError);
//       setError(`Error: ${cancelError.message}`);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-error">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>ORDER DETAILS</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card">
//         <div className="order-item">
//           <img src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} alt={orderItems[0]?.products?.name || 'Product'} className="order-image" />
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.name || 'No products found'} - IND-9</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method || 'Cash'} ₹{(order.total || order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>All issue easy returns</p>
//           </div>
//           <span className="chevron"></span>
//         </div>
//       </div>

//       <div className="order-status">
//         <h3 style={{ color: '#007bff' }}>Order Status</h3>
//         <p style={{ color: '#666' }}>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline">
//           <span className={`status-step ${order.order_status === 'Cancelled' ? '' : 'active'}`}>Ordered<br />23 Feb</span>
//           <span className={`status-step ${order.order_status === 'Cancelled' ? '' : order.order_status === 'Shipped' || order.order_status === 'Delivered' ? 'active' : ''}`}>Shipped<br />25 Feb</span>
//           <span className={`status-step ${order.order_status === 'Delivered' ? 'active' : ''}`}>Out for Delivery<br />04 Mar</span>
//           <span className={`status-step ${order.order_status === 'Delivered' ? 'active' : ''}`}>Delivery<br />04 Mar</span>
//         </div>
//         <p className="shipping-soon" style={{ color: '#666' }}>{order.order_status === 'Pending' ? 'Shipping Soon!' : ''}</p>
//         <p style={{ color: '#666' }}>{order.order_status === 'Pending' ? 'Cancellation available till shipping!' : ''}</p>
//         {order.order_status === 'Pending' && (
//           <button className="cancel-button" onClick={handleCancelOrder} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
//             Cancel Order
//           </button>
//         )}
//       </div>

//       <div className="delivery-address">
//         <h3 style={{ color: '#007bff' }}>Delivery Address</h3>
//         <p style={{ color: '#666' }}>Raghu Kumar</p>
//         <p style={{ color: '#666' }}>Raghunathpura bus stop near sbi atm bengaluru rural, Near sbi atm, Raghunathpura, Karnataka - 562163</p>
//         <p style={{ color: '#666' }}>8825287284</p>
//         <button className="change-button" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CHANGE</button>
//       </div>

//       <div className="order-items-list">
//         <h3 style={{ color: '#007bff' }}>Ordered Products</h3>
//         {orderItems.length > 0 ? (
//           orderItems.map((item) => (
//             <div key={item.id} className="order-item-detail" style={{ color: '#666' }}>
//               {item.products.name} - Quantity: {item.quantity} - Price: ₹{item.products.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No products found for this order.</p>
//         )}
//       </div>

//       <div className="recently-viewed">
//         <h3 style={{ color: '#007bff' }}>Recently Viewed</h3>
//         <div className="recent-items">
//           <div className="recent-item">
//             <img src="https://dummyimage.com/100" alt="Shirts" className="recent-image" />
//             <p style={{ color: '#666' }}>Shirts</p>
//           </div>
//           <div className="recent-item">
//             <img src="https://dummyimage.com/100" alt="Orthopedic & Diabetic Slippers" className="recent-image" />
//             <p style={{ color: '#666' }}>Orthopedic & Diabetic Slippers</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showCancelReason, setShowCancelReason] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [userId, setUserId] = useState(null); // Store the user's ID from session
//   const [profile, setProfile] = useState(null); // Store profile data for role checking
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSessionAndOrder = async () => {
//       setLoading(true);
//       let attempt = 0;
//       const maxAttempts = 3;

//       while (attempt < maxAttempts) {
//         try {
//           const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//           if (sessionError || !session?.user) {
//             setError('Authentication required. Please ensure you are logged in.');
//             navigate('/auth');
//             setLoading(false);
//             return;
//           }
//           setUserId(session.user.id);

//           // Fetch profile to check if user is a seller or buyer
//           const { data: profileData, error: profileError } = await supabase
//             .from('profiles')
//             .select('is_seller')
//             .eq('id', session.user.id)
//             .single();

//           if (profileError) throw profileError;
//           setProfile(profileData);

//           await fetchOrderDetails();
//           return;
//         } catch (fetchError) {
//           console.error(`Attempt ${attempt + 1} - Error fetching session or profile:`, fetchError);
//           attempt++;
//           if (attempt === maxAttempts) {
//             setError(`Error: ${fetchError.message || 'Failed to authenticate after multiple attempts. Please log in and try again.'}`);
//             navigate('/auth');
//             setLoading(false);
//             return;
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//         }
//       }
//     };
//     fetchSessionAndOrder();
//   }, [orderId, navigate]);

//   const fetchOrderDetails = async () => {
//     if (!userId) {
//       setError('Authentication required. Please ensure you are logged in.');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('id, user_id, seller_id, order_status, total_amount, payment_method, shipping_address, shipping_location, created_at, updated_at, cancel_reason')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//           console.log(`Order ID ${orderId} does not exist in the orders table or is not accessible. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order. Please check your permissions.');
//           console.log(`RLS violation for Order ID ${orderId}. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else {
//           throw orderError;
//         }
//         setLoading(false);
//         return;
//       }

//       const isBuyer = orderData.user_id === userId;
//       const isSeller = orderData.seller_id === userId;

//       console.log(`User ID: ${userId}, Order User ID: ${orderData.user_id}, Order Seller ID: ${orderData.seller_id}, Is Buyer: ${isBuyer}, Is Seller: ${isSeller}, Is Seller Role: ${profile?.is_seller}`);

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(title, price, images)')
//         .eq('order_id', orderId);

//       if (itemsError) {
//         if (itemsError.code === '42501') {
//           setError('You are not authorized to view order items. Please check your permissions.');
//           console.log(`RLS violation for Order Items of Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw itemsError;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//       console.log(`Fetched order ID: ${orderData.id}, Order Items:`, itemsData, 'Cancel Reason:', orderData.cancel_reason);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     if (!cancelReason) {
//       setError('Please provide a reason for cancellation.');
//       return;
//     }

//     if (!userId) {
//       setError('Authentication required to cancel the order.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'cancelled', cancel_reason: cancelReason })
//         .eq('id', orderId);

//       if (error) {
//         if (error.code === '42501') {
//           setError('You are not authorized to cancel this order. Please check your permissions.');
//           console.log(`RLS violation for cancelling Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw error;
//         }
//         return;
//       }

//       setOrder({ ...order, order_status: 'cancelled', cancel_reason: cancelReason });
//       setShowCancelReason(false);
//       setCancelReason('');
//       alert('Order has been cancelled successfully.');
//     } catch (cancelError) {
//       console.error('Error cancelling order:', cancelError);
//       setError(`Error: ${cancelError.message}`);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error" style={{ color: '#ff0000' }}>{error}</div>;
//   if (!order) return <div className="order-details-error" style={{ color: '#666' }}>Order not found.</div>;

//   const isBuyer = order.user_id === userId;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>FreshCart Order Details</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', margin: '10px' }}>
//         <div className="order-item">
//           {orderItems.length > 0 && (
//             <img 
//               src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} 
//               alt={orderItems[0]?.products?.title || 'Product'} 
//               style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} 
//               onError={(e) => { e.target.src = 'https://dummyimage.com/100'; console.error('Image load failed for:', orderItems[0]?.products?.title); }}
//             />
//           )}
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
//             <p style={{ color: '#666' }}>User ID: {order.user_id}</p>
//             <p style={{ color: '#666' }}>Seller ID: {order.seller_id}</p>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.title || 'No products found'}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method || 'Cash'} ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>All issue easy returns</p>
//             <p style={{ color: '#666' }}>Last Updated: {new Date(order.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
//           </div>
//           <span className="chevron" style={{ display: 'inline-block', width: '10px', height: '10px', borderRight: '2px solid #007bff', borderBottom: '2px solid #007bff', transform: 'rotate(-45deg)', marginLeft: '10px' }}></span>
//         </div>
//       </div>

//       <div className="order-status" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Order Status</h3>
//         <p style={{ color: '#666' }}>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : 'active'} ${order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'shipped' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Ordered<br />23 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : order.order_status === 'shipped' || order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Shipped<br />25 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Out for Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//         </div>
//         <p className="shipping-soon" style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Shipping Soon!' : ''}</p>
//         <p style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Cancellation available till shipping!' : ''}</p>
//         {order.order_status === 'pending' && isBuyer && (
//           <>
//             <button 
//               className="cancel-button" 
//               onClick={() => setShowCancelReason(true)} 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//             >
//               Cancel Order
//             </button>
//             {showCancelReason && (
//               <div className="cancel-reason" style={{ marginTop: '10px', color: '#666' }}>
//                 <select 
//                   value={cancelReason} 
//                   onChange={(e) => setCancelReason(e.target.value)} 
//                   style={{ padding: '8px', marginRight: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//                 >
//                   <option value="">Select a Reason</option>
//                   <option value="Changed my mind">Changed my mind</option>
//                   <option value="Found a better price">Found a better price</option>
//                   <option value="No longer needed">No longer needed</option>
//                   <option value="Other">Other (specify below)</option>
//                 </select>
//                 {cancelReason === 'Other' && (
//                   <input 
//                     type="text" 
//                     value={cancelReason === 'Other' ? cancelReason : ''} 
//                     onChange={(e) => setCancelReason(e.target.value)} 
//                     placeholder="Enter your reason" 
//                     style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//                   />
//                 )}
//                 <button 
//                   onClick={handleCancelOrder} 
//                   style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Confirm Cancel
//                 </button>
//                 <button 
//                   onClick={() => setShowCancelReason(false)} 
//                   style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//         {order.cancel_reason && order.order_status === 'cancelled' && (
//           <p style={{ color: '#666', marginTop: '10px' }}>Cancellation Reason: {order.cancel_reason}</p>
//         )}
//       </div>

//       <div className="delivery-address" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Delivery Address</h3>
//         <p style={{ color: '#666' }}>Name: John Doe</p>
//         <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Phone: 9876543210</p>
//         <button className="change-button" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CHANGE</button>
//       </div>

//       <div className="order-items-list" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Ordered Products</h3>
//         {orderItems.length > 0 ? (
//           orderItems.map((item) => (
//             <div key={item.id} className="order-item-detail" style={{ color: '#666', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
//               <img 
//                 src={item.products.images?.[0] || 'https://dummyimage.com/50'} 
//                 alt={item.products.title} 
//                 style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }} 
//                 onError={(e) => { e.target.src = 'https://dummyimage.com/50'; console.error('Image load failed for:', item.products.title); }}
//               />
//               {item.products.title} - Quantity: {item.quantity} - Price: ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No products found for this order.</p>
//         )}
//       </div>

//       <div className="recently-viewed" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Recently Viewed</h3>
//         <div className="recent-items" style={{ display: 'flex', gap: '10px' }}>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Shirts" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Shirts</p>
//           </div>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Orthopedic Slippers" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Orthopedic Slippers</p>
//           </div>
//         </div>
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

// export default OrderDetails;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showCancelReason, setShowCancelReason] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [userId, setUserId] = useState(null); // Store the user's ID from session
//   const [profile, setProfile] = useState(null); // Store profile data for role checking
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSessionAndOrder = async () => {
//       setLoading(true);
//       let attempt = 0;
//       const maxAttempts = 3;

//       while (attempt < maxAttempts) {
//         try {
//           let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//           if (sessionError || !session?.user) {
//             // Attempt to refresh the session if it’s expired
//             const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//             if (refreshError || !refreshData.session?.user) {
//               setError('Authentication required. Please ensure you are logged in.');
//               navigate('/auth');
//               setLoading(false);
//               return;
//             }
//             session = refreshData.session;
//           }
//           setUserId(session.user.id);

//           // Fetch profile to check if user is a seller or buyer
//           const { data: profileData, error: profileError } = await supabase
//             .from('profiles')
//             .select('is_seller')
//             .eq('id', session.user.id)
//             .single();

//           if (profileError) throw profileError;
//           setProfile(profileData);

//           await fetchOrderDetails();
//           return;
//         } catch (fetchError) {
//           console.error(`Attempt ${attempt + 1} - Error fetching session or profile:`, fetchError);
//           attempt++;
//           if (attempt === maxAttempts) {
//             setError(`Error: ${fetchError.message || 'Failed to authenticate after multiple attempts. Please log in and try again.'}`);
//             navigate('/auth');
//             setLoading(false);
//             return;
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//         }
//       }
//     };
//     fetchSessionAndOrder();
//   }, [orderId, navigate]);

//   const fetchOrderDetails = async () => {
//     if (!userId) {
//       setError('Authentication required. Please ensure you are logged in.');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('id, user_id, seller_id, order_status, total, payment_method, shipping_address, shipping_location, created_at, updated_at, cancel_reason')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//           console.log(`Order ID ${orderId} does not exist in the orders table or is not accessible. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order. Please check your permissions.');
//           console.log(`RLS violation for Order ID ${orderId}. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else {
//           throw orderError;
//         }
//         setLoading(false);
//         return;
//       }

//       const isBuyer = orderData.user_id === userId;
//       const isSeller = orderData.seller_id === userId;

//       console.log(`User ID: ${userId}, Order User ID: ${orderData.user_id}, Order Seller ID: ${orderData.seller_id}, Is Buyer: ${isBuyer}, Is Seller: ${isSeller}, Is Seller Role: ${profile?.is_seller}`);

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(title, price, images)')
//         .eq('order_id', orderId);

//       if (itemsError) {
//         if (itemsError.code === '42501') {
//           setError('You are not authorized to view order items. Please check your permissions.');
//           console.log(`RLS violation for Order Items of Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw itemsError;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//       console.log(`Fetched order ID: ${orderData.id}, Order Items:`, itemsData, 'Cancel Reason:', orderData.cancel_reason);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     if (!cancelReason) {
//       setError('Please provide a reason for cancellation.');
//       return;
//     }

//     if (!userId) {
//       setError('Authentication required to cancel the order.');
//       return;
//     }

//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         // Attempt to refresh the session if it’s expired
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         if (refreshError || !refreshData.session?.user) {
//           setError('Authentication required to cancel the order. Please ensure you are logged in.');
//           navigate('/auth');
//           return;
//         }
//         session = refreshData.session;
//       }

//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'cancelled', cancel_reason: cancelReason })
//         .eq('id', orderId);

//       if (error) {
//         if (error.code === '42501') {
//           setError('You are not authorized to cancel this order. Please check your permissions.');
//           console.log(`RLS violation for cancelling Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw error;
//         }
//         return;
//       }

//       setOrder({ ...order, order_status: 'cancelled', cancel_reason: cancelReason });
//       setShowCancelReason(false);
//       setCancelReason('');
//       alert('Order has been cancelled successfully.');
//     } catch (cancelError) {
//       console.error('Error cancelling order:', cancelError);
//       setError(`Error: ${cancelError.message}`);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error" style={{ color: '#ff0000' }}>{error}</div>;
//   if (!order) return <div className="order-details-error" style={{ color: '#666' }}>Order not found.</div>;

//   const isBuyer = order.user_id === userId;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>FreshCart Order Details</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', margin: '10px' }}>
//         <div className="order-item">
//           {orderItems.length > 0 && (
//             <img 
//               src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} 
//               alt={orderItems[0]?.products?.title || 'Product'} 
//               style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} 
//               onError={(e) => { e.target.src = 'https://dummyimage.com/100'; console.error('Image load failed for:', orderItems[0]?.products?.title); }}
//             />
//           )}
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
//             <p style={{ color: '#666' }}>User ID: {order.user_id}</p>
//             <p style={{ color: '#666' }}>Seller ID: {order.seller_id}</p>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.title || 'No products found'}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method || 'Cash'} ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>All issue easy returns</p>
//             <p style={{ color: '#666' }}>Last Updated: {new Date(order.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
//           </div>
//           <span className="chevron" style={{ display: 'inline-block', width: '10px', height: '10px', borderRight: '2px solid #007bff', borderBottom: '2px solid #007bff', transform: 'rotate(-45deg)', marginLeft: '10px' }}></span>
//         </div>
//       </div>

//       <div className="order-status" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Order Status</h3>
//         <p style={{ color: '#666' }}>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : 'active'} ${order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'shipped' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Ordered<br />23 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : order.order_status === 'shipped' || order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Shipped<br />25 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Out for Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//         </div>
//         <p className="shipping-soon" style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Shipping Soon!' : ''}</p>
//         <p style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Cancellation available till shipping!' : ''}</p>
//         {order.order_status === 'pending' && isBuyer && (
//           <>
//             <button 
//               className="cancel-button" 
//               onClick={() => setShowCancelReason(true)} 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//             >
//               Cancel Order
//             </button>
//             {showCancelReason && (
//               <div className="cancel-reason" style={{ marginTop: '10px', color: '#666' }}>
//                 <select 
//                   value={cancelReason} 
//                   onChange={(e) => setCancelReason(e.target.value)} 
//                   style={{ padding: '8px', marginRight: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//                 >
//                   <option value="">Select a Reason</option>
//                   <option value="Changed my mind">Changed my mind</option>
//                   <option value="Found a better price">Found a better price</option>
//                   <option value="No longer needed">No longer needed</option>
//                   <option value="Other">Other (specify below)</option>
//                 </select>
//                 {cancelReason === 'Other' && (
//                   <input 
//                     type="text" 
//                     value={cancelReason === 'Other' ? cancelReason : ''} 
//                     onChange={(e) => setCancelReason(e.target.value)} 
//                     placeholder="Enter your reason" 
//                     style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//                   />
//                 )}
//                 <button 
//                   onClick={handleCancelOrder} 
//                   style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Confirm Cancel
//                 </button>
//                 <button 
//                   onClick={() => setShowCancelReason(false)} 
//                   style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//         {order.cancel_reason && order.order_status === 'cancelled' && (
//           <p style={{ color: '#666', marginTop: '10px' }}>Cancellation Reason: {order.cancel_reason}</p>
//         )}
//       </div>

//       <div className="delivery-address" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Delivery Address</h3>
//         <p style={{ color: '#666' }}>Name: John Doe</p>
//         <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Phone: 9876543210</p>
//         <button className="change-button" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CHANGE</button>
//       </div>

//       <div className="order-items-list" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Ordered Products</h3>
//         {orderItems.length > 0 ? (
//           orderItems.map((item) => (
//             <div key={item.id} className="order-item-detail" style={{ color: '#666', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
//               <img 
//                 src={item.products.images?.[0] || 'https://dummyimage.com/50'} 
//                 alt={item.products.title} 
//                 style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }} 
//                 onError={(e) => { e.target.src = 'https://dummyimage.com/50'; console.error('Image load failed for:', item.products.title); }}
//               />
//               {item.products.title} - Quantity: {item.quantity} - Price: ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No products found for this order.</p>
//         )}
//       </div>

//       <div className="recently-viewed" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Recently Viewed</h3>
//         <div className="recent-items" style={{ display: 'flex', gap: '10px' }}>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Shirts" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Shirts</p>
//           </div>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Orthopedic Slippers" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Orthopedic Slippers</p>
//           </div>
//         </div>
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

// export default OrderDetails;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showCancelReason, setShowCancelReason] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [userId, setUserId] = useState(null); // Store the user's ID from session
//   const [profile, setProfile] = useState(null); // Store profile data for role checking

//   useEffect(() => {
//     const fetchSessionAndOrder = async () => {
//       setLoading(true);
//       let attempt = 0;
//       const maxAttempts = 3;

//       // Validate orderId
//       if (!orderId || isNaN(parseInt(orderId))) {
//         setError('Invalid order ID.');
//         setLoading(false);
//         return;
//       }

//       // Use session from navigation state if available
//       let session = location.state?.session;
//       if (!session) {
//         while (attempt < maxAttempts) {
//           try {
//             let { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
//             console.log('Current session before refresh:', currentSession);
//             if (sessionError || !currentSession?.user || (currentSession.expires_at && Date.now() / 1000 >= currentSession.expires_at)) {
//               const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//               console.log('Session refresh attempt:', { refreshData, refreshError });
//               if (refreshError || !refreshData.session?.user) {
//                 if (attempt === maxAttempts - 1) {
//                   setError('Authentication required. Please ensure you are logged in.');
//                   navigate('/auth');
//                   setLoading(false);
//                   return;
//                 }
//                 attempt++;
//                 await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
//                 continue;
//               }
//               session = refreshData.session;
//             } else {
//               session = currentSession;
//             }
//             break;
//           } catch (fetchError) {
//             console.error(`Attempt ${attempt + 1} - Error fetching session or profile:`, fetchError);
//             attempt++;
//             if (attempt === maxAttempts) {
//               setError(`Error: ${fetchError.message || 'Failed to authenticate after multiple attempts. Please log in and try again.'}`);
//               navigate('/auth');
//               setLoading(false);
//               return;
//             }
//             await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
//           }
//         }
//       }

//       setUserId(session.user.id);

//       // Fetch profile to check if user is a seller or buyer
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();

//       if (profileError) throw profileError;
//       setProfile(profileData);

//       await fetchOrderDetails();
//     };
//     fetchSessionAndOrder();
//   }, [orderId, navigate, location.state]);

//   const fetchOrderDetails = async () => {
//     if (!userId) {
//       setError('Authentication required. Please ensure you are logged in.');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('id, user_id, seller_id, order_status, total, payment_method, shipping_address, shipping_location, created_at, updated_at, cancel_reason')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//           console.log(`Order ID ${orderId} does not exist in the orders table or is not accessible. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order. Please check your permissions.');
//           console.log(`RLS violation for Order ID ${orderId}. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else {
//           throw orderError;
//         }
//         setLoading(false);
//         return;
//       }

//       const isBuyer = orderData.user_id === userId;
//       const isSeller = orderData.seller_id === userId;

//       console.log(`User ID: ${userId}, Order User ID: ${orderData.user_id}, Order Seller ID: ${orderData.seller_id}, Is Buyer: ${isBuyer}, Is Seller: ${isSeller}, Is Seller Role: ${profile?.is_seller}`);

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(title, price, images)')
//         .eq('order_id', orderId);

//       if (itemsError) {
//         if (itemsError.code === '42501') {
//           setError('You are not authorized to view order items. Please check your permissions.');
//           console.log(`RLS violation for Order Items of Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw itemsError;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//       console.log(`Fetched order ID: ${orderData.id}, Order Items:`, itemsData, 'Cancel Reason:', orderData.cancel_reason);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     if (!cancelReason) {
//       setError('Please provide a reason for cancellation.');
//       return;
//     }

//     if (!userId) {
//       setError('Authentication required to cancel the order.');
//       return;
//     }

//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Current session before cancel:', session);
//       if (sessionError || !session?.user || (session.expires_at && Date.now() / 1000 >= session.expires_at)) {
//         const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//         console.log('Session refresh attempt for cancel:', { refreshData, refreshError });
//         if (refreshError || !refreshData.session?.user) {
//           setError('Authentication required to cancel the order. Please ensure you are logged in.');
//           navigate('/auth');
//           setLoading(false);
//           return;
//         }
//         session = refreshData.session;
//       }

//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'cancelled', cancel_reason: cancelReason })
//         .eq('id', orderId)
//         .eq('user_id', userId); // Ensure only the buyer can cancel

//       if (error) {
//         if (error.code === '42501') {
//           setError('You are not authorized to cancel this order. Please check your permissions.');
//           console.log(`RLS violation for cancelling Order ID ${orderId}. User ID: ${userId}`);
//         } else if (error.code === 'PGRST116') {
//           setError('Order not found or not accessible.');
//         } else {
//           throw error;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder({ ...order, order_status: 'cancelled', cancel_reason: cancelReason });
//       setShowCancelReason(false);
//       setCancelReason('');
//       alert('Order has been cancelled successfully.');
//     } catch (cancelError) {
//       console.error('Error cancelling order:', cancelError);
//       setError(`Error: ${cancelError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error" style={{ color: '#ff0000' }}>{error}</div>;
//   if (!order) return <div className="order-details-error" style={{ color: '#666' }}>Order not found.</div>;

//   const isBuyer = order.user_id === userId;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>FreshCart Order Details</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', margin: '10px' }}>
//         <div className="order-item">
//           {orderItems.length > 0 && (
//             <img 
//               src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} 
//               alt={orderItems[0]?.products?.title || 'Product'} 
//               style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} 
//               onError={(e) => { e.target.src = 'https://dummyimage.com/100'; console.error('Image load failed for:', orderItems[0]?.products?.title); }}
//             />
//           )}
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
//             <p style={{ color: '#666' }}>User ID: {order.user_id}</p>
//             <p style={{ color: '#666' }}>Seller ID: {order.seller_id}</p>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.title || 'No products found'}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method || 'Cash'} ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>All issue easy returns</p>
//             <p style={{ color: '#666' }}>Last Updated: {new Date(order.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
//           </div>
//           <span className="chevron" style={{ display: 'inline-block', width: '10px', height: '10px', borderRight: '2px solid #007bff', borderBottom: '2px solid #007bff', transform: 'rotate(-45deg)', marginLeft: '10px' }}></span>
//         </div>
//       </div>

//       <div className="order-status" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Order Status</h3>
//         <p style={{ color: '#666' }}>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : 'active'} ${order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'shipped' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Ordered<br />23 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : order.order_status === 'shipped' || order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Shipped<br />25 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Out for Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//         </div>
//         <p className="shipping-soon" style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Shipping Soon!' : ''}</p>
//         <p style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Cancellation available till shipping!' : ''}</p>
//         {order.order_status === 'pending' && isBuyer && (
//           <>
//             <button 
//               className="cancel-button" 
//               onClick={() => setShowCancelReason(true)} 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//             >
//               Cancel Order
//             </button>
//             {showCancelReason && (
//               <div className="cancel-reason" style={{ marginTop: '10px', color: '#666' }}>
//                 <select 
//                   value={cancelReason} 
//                   onChange={(e) => setCancelReason(e.target.value)} 
//                   style={{ padding: '8px', marginRight: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//                 >
//                   <option value="">Select a Reason</option>
//                   <option value="Changed my mind">Changed my mind</option>
//                   <option value="Found a better price">Found a better price</option>
//                   <option value="No longer needed">No longer needed</option>
//                   <option value="Other">Other (specify below)</option>
//                 </select>
//                 {cancelReason === 'Other' && (
//                   <input 
//                     type="text" 
//                     value={cancelReason === 'Other' ? cancelReason : ''} 
//                     onChange={(e) => setCancelReason(e.target.value)} 
//                     placeholder="Enter your reason" 
//                     style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//                   />
//                 )}
//                 <button 
//                   onClick={handleCancelOrder} 
//                   style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Confirm Cancel
//                 </button>
//                 <button 
//                   onClick={() => setShowCancelReason(false)} 
//                   style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//         {order.cancel_reason && order.order_status === 'cancelled' && (
//           <p style={{ color: '#666', marginTop: '10px' }}>Cancellation Reason: {order.cancel_reason}</p>
//         )}
//       </div>

//       <div className="delivery-address" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Delivery Address</h3>
//         <p style={{ color: '#666' }}>Name: John Doe</p>
//         <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Phone: 9876543210</p>
//         <button className="change-button" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CHANGE</button>
//       </div>

//       <div className="order-items-list" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Ordered Products</h3>
//         {orderItems.length > 0 ? (
//           orderItems.map((item) => (
//             <div key={item.id} className="order-item-detail" style={{ color: '#666', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
//               <img 
//                 src={item.products.images?.[0] || 'https://dummyimage.com/50'} 
//                 alt={item.products.title} 
//                 style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }} 
//                 onError={(e) => { e.target.src = 'https://dummyimage.com/50'; console.error('Image load failed for:', item.products.title); }}
//               />
//               {`${item.products.title} - Quantity: ${item.quantity} - Price: ₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No products found for this order.</p>
//         )}
//       </div>

//       <div className="recently-viewed" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Recently Viewed</h3>
//         <div className="recent-items" style={{ display: 'flex', gap: '10px' }}>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Shirts" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Shirts</p>
//           </div>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Orthopedic Slippers" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Orthopedic Slippers</p>
//           </div>
//         </div>
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

// export default OrderDetails;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showCancelReason, setShowCancelReason] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [userId, setUserId] = useState(null); // Store the user's ID from session
//   const [profile, setProfile] = useState(null); // Store profile data for role checking

//   useEffect(() => {
//     let mounted = true; // Flag to prevent state updates after unmount

//     const fetchSessionAndOrder = async () => {
//       if (!mounted) return; // Prevent updates if unmounted
//       setLoading(true);
//       let attempt = 0;
//       const maxAttempts = 3;

//       // Validate orderId
//       if (!orderId || isNaN(parseInt(orderId))) {
//         if (mounted) {
//           setError('Invalid order ID.');
//           setLoading(false);
//         }
//         return;
//       }

//       // Use session from navigation state if available, otherwise fetch from server
//       let session = location.state?.session;
//       console.log('Session from navigation state:', session);
//       if (!session) {
//         while (attempt < maxAttempts) {
//           try {
//             let { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
//             console.log('Current session before refresh:', currentSession);
//             if (sessionError || !currentSession?.user || (currentSession.expires_at && Date.now() / 1000 >= currentSession.expires_at)) {
//               const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//               console.log('Session refresh attempt:', { refreshData, refreshError });
//               if (refreshError) {
//                 if (refreshError.message && refreshError.message.includes('invalid refresh token')) {
//                   console.error('Invalid refresh token detected:', refreshError);
//                   if (mounted) {
//                     setError('Session refresh failed due to an invalid refresh token. Please log in again.');
//                     navigate('/auth');
//                     setLoading(false);
//                   }
//                   return;
//                 }
//                 if (attempt === maxAttempts - 1) {
//                   console.error('Session refresh failed after attempts:', refreshError);
//                   if (mounted) {
//                     setError('Authentication required. Please ensure you are logged in.');
//                     navigate('/auth');
//                     setLoading(false);
//                   }
//                   return;
//                 }
//                 attempt++;
//                 await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
//                 continue;
//               }
//               session = refreshData.session;
//             } else {
//               session = currentSession;
//             }
//             break;
//           } catch (fetchError) {
//             console.error(`Attempt ${attempt + 1} - Error fetching session or profile:`, fetchError);
//             attempt++;
//             if (attempt === maxAttempts) {
//               if (mounted) {
//                 setError(`Error: ${fetchError.message || 'Failed to authenticate after multiple attempts. Please log in and try again.'}`);
//                 navigate('/auth');
//                 setLoading(false);
//               }
//               return;
//             }
//             await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
//           }
//         }
//       }

//       if (!session?.user) {
//         if (mounted) {
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           setLoading(false);
//         }
//         return;
//       }

//       if (mounted) {
//         setUserId(session.user.id);

//         // Fetch profile to check if user is a seller or buyer
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();

//         if (profileError) {
//           console.error('Profile fetch error:', profileError);
//           if (profileError.code === '42501') {
//             setError('You are not authorized to access this profile. Please log in again.');
//           } else {
//             throw profileError;
//           }
//           setLoading(false);
//           return;
//         }
//         setProfile(profileData);

//         await fetchOrderDetails();
//       }
//     };
//     fetchSessionAndOrder();

//     return () => {
//       mounted = false; // Cleanup on unmount
//     };
//   }, [orderId, navigate, location.state]);

//   const fetchOrderDetails = async () => {
//     if (!userId) {
//       setError('Authentication required. Please ensure you are logged in.');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select('id, user_id, seller_id, order_status, total, payment_method, shipping_address, shipping_location, created_at, updated_at, cancel_reason')
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//           console.log(`Order ID ${orderId} does not exist in the orders table or is not accessible. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order. Please check your permissions.');
//           console.log(`RLS violation for Order ID ${orderId}. User ID: ${userId}, Order User ID: ${orderData?.user_id}, Order Seller ID: ${orderData?.seller_id}`);
//         } else {
//           throw orderError;
//         }
//         setLoading(false);
//         return;
//       }

//       const isBuyer = orderData.user_id === userId;
//       const isSeller = orderData.seller_id === userId;

//       console.log(`User ID: ${userId}, Order User ID: ${orderData.user_id}, Order Seller ID: ${orderData.seller_id}, Is Buyer: ${isBuyer}, Is Seller: ${isSeller}, Is Seller Role: ${profile?.is_seller}`);

//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(title, price, images)')
//         .eq('order_id', orderId);

//       if (itemsError) {
//         if (itemsError.code === '42501') {
//           setError('You are not authorized to view order items. Please check your permissions.');
//           console.log(`RLS violation for Order Items of Order ID ${orderId}. User ID: ${userId}`);
//         } else {
//           throw itemsError;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//       console.log(`Fetched order ID: ${orderData.id}, Order Items:`, itemsData, 'Cancel Reason:', orderData.cancel_reason);
//     } catch (fetchError) {
//       console.error('Error fetching order details:', fetchError);
//       setError(`Error: ${fetchError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     if (!cancelReason) {
//       setError('Please provide a reason for cancellation.');
//       return;
//     }

//     if (!userId) {
//       setError('Authentication required to cancel the order.');
//       return;
//     }

//     setLoading(true);
//     try {
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       console.log('Current session before cancel:', session);
//       if (sessionError || !session?.user || (session.expires_at && Date.now() / 1000 >= session.expires_at)) {
//         let refreshAttempt = 0;
//         const maxRefreshAttempts = 3;
//         while (refreshAttempt < maxRefreshAttempts) {
//           try {
//             const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
//             console.log('Session refresh attempt for cancel:', { refreshData, refreshError });
//             if (refreshError) {
//               if (refreshError.message && refreshError.message.includes('invalid refresh token')) {
//                 console.error('Invalid refresh token detected for cancel:', refreshError);
//                 setError('Session refresh failed due to an invalid refresh token. Please log in again.');
//                 navigate('/auth');
//                 setLoading(false);
//                 return;
//               }
//               if (refreshAttempt === maxRefreshAttempts - 1) {
//                 console.error('Session refresh failed after attempts for cancel:', refreshError);
//                 setError('Authentication required to cancel the order. Please ensure you are logged in.');
//                 navigate('/auth');
//                 setLoading(false);
//                 return;
//               }
//               refreshAttempt++;
//               await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, refreshAttempt))); // Exponential backoff
//               continue;
//             }
//             session = refreshData.session;
//             break;
//           } catch (refreshErr) {
//             console.error(`Refresh attempt ${refreshAttempt + 1} error for cancel:`, refreshErr);
//             refreshAttempt++;
//             if (refreshAttempt === maxRefreshAttempts) {
//               setError('Failed to refresh session for cancel. Please log in again.');
//               navigate('/auth');
//               setLoading(false);
//               return;
//             }
//             await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, refreshAttempt))); // Exponential backoff
//           }
//         }
//       }

//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'cancelled', cancel_reason: cancelReason })
//         .eq('id', orderId)
//         .eq('user_id', userId); // Ensure only the buyer can cancel

//       if (error) {
//         if (error.code === '42501') {
//           setError('You are not authorized to cancel this order. Please check your permissions.');
//           console.log(`RLS violation for cancelling Order ID ${orderId}. User ID: ${userId}`);
//         } else if (error.code === 'PGRST116') {
//           setError('Order not found or not accessible.');
//         } else {
//           throw error;
//         }
//         setLoading(false);
//         return;
//       }

//       setOrder({ ...order, order_status: 'cancelled', cancel_reason: cancelReason });
//       setShowCancelReason(false);
//       setCancelReason('');
//       alert('Order has been cancelled successfully.');
//     } catch (cancelError) {
//       console.error('Error cancelling order:', cancelError);
//       setError(`Error: ${cancelError.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error" style={{ color: '#ff0000' }}>{error}</div>;
//   if (!order) return <div className="order-details-error" style={{ color: '#666' }}>Order not found.</div>;

//   const isBuyer = order.user_id === userId;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>FreshCart Order Details</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', margin: '10px' }}>
//         <div className="order-item">
//           {orderItems.length > 0 && (
//             <img 
//               src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} 
//               alt={orderItems[0]?.products?.title || 'Product'} 
//               style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} 
//               onError={(e) => { e.target.src = 'https://dummyimage.com/100'; console.error('Image load failed for:', orderItems[0]?.products?.title); }}
//             />
//           )}
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
//             <p style={{ color: '#666' }}>User ID: {order.user_id}</p>
//             <p style={{ color: '#666' }}>Seller ID: {order.seller_id}</p>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.title || 'No products found'}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method || 'Cash'} ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>All issue easy returns</p>
//             <p style={{ color: '#666' }}>Last Updated: {new Date(order.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
//           </div>
//           <span className="chevron" style={{ display: 'inline-block', width: '10px', height: '10px', borderRight: '2px solid #007bff', borderBottom: '2px solid #007bff', transform: 'rotate(-45deg)', marginLeft: '10px' }}></span>
//         </div>
//       </div>

//       <div className="order-status" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Order Status</h3>
//         <p style={{ color: '#666' }}>Delivery by Tue, 04 Mar</p>
//         <div className="status-timeline" style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : 'active'} ${order.order_status === 'cancelled' || order.order_status === 'delivered' || order.order_status === 'shipped' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Ordered<br />23 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'cancelled' ? '' : order.order_status === 'shipped' || order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'shipped' || order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Shipped<br />25 Feb
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Out for Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//           <span className={`status-step ${order.order_status === 'delivered' ? 'active' : ''} ${order.order_status === 'delivered' ? 'checked' : ''}`} style={{ color: '#666', position: 'relative', flex: '1', textAlign: 'center' }}>
//             Delivery<br />04 Mar
//             <span style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', backgroundColor: order.order_status === 'cancelled' ? '#ccc' : '#007bff', borderRadius: '50%' }}></span>
//           </span>
//         </div>
//         <p className="shipping-soon" style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Shipping Soon!' : ''}</p>
//         <p style={{ color: '#666' }}>{order.order_status === 'pending' ? 'Cancellation available till shipping!' : ''}</p>
//         {order.order_status === 'pending' && isBuyer && (
//           <>
//             <button 
//               className="cancel-button" 
//               onClick={() => setShowCancelReason(true)} 
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//             >
//               Cancel Order
//             </button>
//             {showCancelReason && (
//               <div className="cancel-reason" style={{ marginTop: '10px', color: '#666' }}>
//                 <select 
//                   value={cancelReason} 
//                   onChange={(e) => setCancelReason(e.target.value)} 
//                   style={{ padding: '8px', marginRight: '10px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//                 >
//                   <option value="">Select a Reason</option>
//                   <option value="Changed my mind">Changed my mind</option>
//                   <option value="Found a better price">Found a better price</option>
//                   <option value="No longer needed">No longer needed</option>
//                   <option value="Other">Other (specify below)</option>
//                 </select>
//                 {cancelReason === 'Other' && (
//                   <input 
//                     type="text" 
//                     value={cancelReason === 'Other' ? cancelReason : ''} 
//                     onChange={(e) => setCancelReason(e.target.value)} 
//                     placeholder="Enter your reason" 
//                     style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginLeft: '10px', backgroundColor: 'white', color: '#666' }}
//                   />
//                 )}
//                 <button 
//                   onClick={handleCancelOrder} 
//                   style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Confirm Cancel
//                 </button>
//                 <button 
//                   onClick={() => setShowCancelReason(false)} 
//                   style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//         {order.cancel_reason && order.order_status === 'cancelled' && (
//           <p style={{ color: '#666', marginTop: '10px' }}>Cancellation Reason: {order.cancel_reason}</p>
//         )}
//       </div>

//       <div className="delivery-address" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Delivery Address</h3>
//         <p style={{ color: '#666' }}>Name: John Doe</p>
//         <p style={{ color: '#666' }}>Shipping Address: {order.shipping_address || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location || 'Not provided'}</p>
//         <p style={{ color: '#666' }}>Phone: 9876543210</p>
//         <button className="change-button" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CHANGE</button>
//       </div>

//       <div className="order-items-list" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Ordered Products</h3>
//         {orderItems.length > 0 ? (
//           orderItems.map((item) => (
//             <div key={item.id} className="order-item-detail" style={{ color: '#666', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
//               <img 
//                 src={item.products.images?.[0] || 'https://dummyimage.com/50'} 
//                 alt={item.products.title || 'Unnamed Product'} 
//                 style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }} 
//                 onError={(e) => { e.target.src = 'https://dummyimage.com/50'; console.error('Image load failed for:', item.products.title || 'Unnamed Product'); }}
//               />
//               {`${item.products.title || 'Unnamed Product'} - Quantity: ${item.quantity} - Price: ₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No products found for this order.</p>
//         )}
//       </div>

//       <div className="recently-viewed" style={{ margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
//         <h3 style={{ color: '#007bff' }}>Recently Viewed</h3>
//         <div className="recent-items" style={{ display: 'flex', gap: '10px' }}>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Shirts" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Shirts</p>
//           </div>
//           <div className="recent-item" style={{ flex: '1', textAlign: 'center' }}>
//             <img src="https://dummyimage.com/100" alt="Orthopedic Slippers" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
//             <p style={{ color: '#666' }}>Orthopedic Slippers</p>
//           </div>
//         </div>
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

// export default OrderDetails;



// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [order, setOrder] = useState(null);
//   const [orderItems, setOrderItems] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [userId, setUserId] = useState(null);
//   const [profile, setProfile] = useState(null);

//   useEffect(() => {
//     async function fetchData() {
//       setLoading(true);
//       // Try to get the session from location.state; if not, fetch it from Supabase
//       let session = location.state?.session;
//       if (!session) {
//         const { data: { session: currentSession } } = await supabase.auth.getSession();
//         if (!currentSession?.user) {
//           setError('Authentication required. Please ensure you are logged in.');
//           navigate('/auth');
//           setLoading(false);
//           return;
//         }
//         session = currentSession;
//       }
//       setUserId(session.user.id);

//       // Fetch profile for role checking
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) {
//         console.error('Profile fetch error:', profileError);
//         setError('Error fetching profile. Please log in again.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }
//       setProfile(profileData);

//       await fetchOrderDetails(session);
//     }
//     fetchData();
//   }, [orderId, navigate, location.state]);

//   const fetchOrderDetails = async (session) => {
//     try {
//       // Fetch order details by ID
//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .select(`
//           id, user_id, seller_id, order_status, total, payment_method,
//           shipping_address, shipping_location, created_at, updated_at, cancel_reason
//         `)
//         .eq('id', orderId)
//         .single();

//       if (orderError) {
//         if (orderError.code === 'PGRST116' || orderError.message.includes('No rows found')) {
//           setError('Order not found.');
//         } else if (orderError.code === '42501') {
//           setError('You are not authorized to view this order. Please check your permissions.');
//         } else {
//           setError(`Error: ${orderError.message}`);
//         }
//         setLoading(false);
//         return;
//       }

//       // Check if the current user is either the buyer or the seller of this order
//       const isBuyer = orderData.user_id === session.user.id;
//       const isSeller = orderData.seller_id === session.user.id;
//       if (!isBuyer && !isSeller) {
//         setError('You are not authorized to view this order.');
//         setLoading(false);
//         return;
//       }

//       // Fetch order items along with product details
//       const { data: itemsData, error: itemsError } = await supabase
//         .from('order_items')
//         .select('*, products(title, price, images)')
//         .eq('order_id', orderId);
//       if (itemsError) {
//         setError(`Error fetching order items: ${itemsError.message}`);
//         setLoading(false);
//         return;
//       }

//       setOrder(orderData);
//       setOrderItems(itemsData || []);
//     } catch (err) {
//       console.error('Error fetching order details:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelOrder = async () => {
//     // ... your existing cancel order logic remains here ...
//   };

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error" style={{ color: '#ff0000' }}>{error}</div>;
//   if (!order) return <div className="order-details-error" style={{ color: '#666' }}>Order not found.</div>;

//   const isBuyer = order.user_id === userId;

//   return (
//     <div className="order-details">
//       <div className="order-details-header">
//         <h1 style={{ color: '#007bff' }}>FreshCart Order Details</h1>
//         <a href="/help" className="help-link" style={{ color: '#007bff' }}>HELP</a>
//       </div>

//       <div className="order-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', margin: '10px' }}>
//         <div className="order-item">
//           {orderItems.length > 0 && (
//             <img 
//               src={orderItems[0]?.products?.images?.[0] || 'https://dummyimage.com/100'} 
//               alt={orderItems[0]?.products?.title || 'Product'} 
//               style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} 
//               onError={(e) => { 
//                 e.target.src = 'https://dummyimage.com/100'; 
//               }}
//             />
//           )}
//           <div className="order-info">
//             <h2 style={{ color: '#007bff' }}>Order #{order.id || 'Unknown'}</h2>
//             <p style={{ color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
//             <p style={{ color: '#666' }}>User ID: {order.user_id}</p>
//             <p style={{ color: '#666' }}>Seller ID: {order.seller_id}</p>
//             <p style={{ color: '#666' }}>{orderItems[0]?.products?.title || 'No products found'}</p>
//             <p style={{ color: '#666' }}>Payment Method: {order.payment_method} ₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//             <p style={{ color: '#666' }}>Last Updated: {new Date(order.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
//           </div>
//         </div>
//       </div>

//       {/* Additional order status, cancellation options, order items, and footer remain unchanged */}
//       {/* ... */}
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css'; // Assuming you have a CSS file for styling

// function OrderDetails() {
//   const { orderId } = useParams(); // Get orderId from URL
//   const location = useLocation(); // Get state passed from Orders component
//   const navigate = useNavigate();
//   const [order, setOrder] = useState(location.state?.order || null); // Use passed state if available
//   const [loading, setLoading] = useState(!location.state?.order); // Load only if no state
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!order) {
//       // Fetch order details if not passed via state
//       const fetchOrderDetails = async () => {
//         setLoading(true);
//         try {
//           const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//           if (sessionError || !session?.user) {
//             setError('Authentication required.');
//             navigate('/auth');
//             return;
//           }

//           const { data, error } = await supabase
//             .from('orders')
//             .select('*, order_items(*, products(title, price, images))')
//             .eq('id', orderId)
//             .single();

//           if (error) throw error;

//           const isBuyer = data.user_id === session.user.id;
//           const isSeller = data.seller_id === session.user.id;
//           if (!isBuyer && !isSeller) {
//             setError('You are not authorized to view this order.');
//             return;
//           }

//           setOrder(data);
//           setError(null);
//         } catch (fetchError) {
//           console.error('Error fetching order details:', fetchError);
//           setError(`Error: ${fetchError.message || 'Failed to fetch order details.'}`);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchOrderDetails();
//     }
//   }, [orderId, order, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   return (
//     <div className="order-details">
//       <h1 style={{ color: '#007bff' }}>Order Details #{order.id}</h1>
//       <section className="order-info">
//         <p style={{ color: '#666' }}>Total: ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//         <p style={{ color: '#666' }}>Payment Method: {order.payment_method}</p>
//         <p style={{ color: '#666' }}>Status: {order.order_status}</p>
//         <p style={{ color: '#666' }}>Shipping Location: {order.shipping_location || 'Not specified'}</p>
//         <p style={{ color: '#666' }}>
//           <strong>Buyer Shipping Address:</strong> {order.shipping_address || 'Not provided'}
//         </p>
//       </section>

//       <section className="order-items">
//         <h2 style={{ color: '#007bff' }}>Ordered Products</h2>
//         {order.order_items && order.order_items.length > 0 ? (
//           order.order_items.map((item) => (
//             <div key={item.id} className="order-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//               <p style={{ color: '#666' }}>
//                 {item.products.title} - Quantity: {item.quantity} - Price: ₹{item.products.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </p>
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No items found for this order.</p>
//         )}
//       </section>

//       <button
//         onClick={() => navigate(-1)} // Go back to previous page
//         style={{
//           backgroundColor: '#007bff',
//           color: '#fff',
//           padding: '10px 20px',
//           border: 'none',
//           borderRadius: '5px',
//           cursor: 'pointer',
//           marginTop: '20px',
//         }}
//       >
//         Back to Orders
//       </button>
//     </div>
//   );
// }

// export default OrderDetails;




// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css'; // We'll add timeline styling here

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   // If order was passed from Account page via location.state, use it; else fetch
//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!order) {
//       // Fetch order details if not passed via state
//       const fetchOrderDetails = async () => {
//         setLoading(true);
//         try {
//           const {
//             data: { session },
//             error: sessionError,
//           } = await supabase.auth.getSession();

//           if (sessionError || !session?.user) {
//             setError('Authentication required.');
//             navigate('/auth');
//             return;
//           }

//           // Adjust your select to retrieve date fields if you have them:
//           const { data, error } = await supabase
//             .from('orders')
//             .select(`
//               *,
//               order_items(*, products(title, price, images))
//             `)
//             .eq('id', orderId)
//             .single();

//           if (error) throw error;

//           // Check if the logged-in user is the buyer or seller
//           const isBuyer = data.user_id === session.user.id;
//           const isSeller = data.seller_id === session.user.id;
//           if (!isBuyer && !isSeller) {
//             setError('You are not authorized to view this order.');
//             return;
//           }

//           setOrder(data);
//           setError(null);
//         } catch (fetchError) {
//           console.error('Error fetching order details:', fetchError);
//           setError(
//             `Error: ${
//               fetchError.message || 'Failed to fetch order details.'
//             }`
//           );
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchOrderDetails();
//     }
//   }, [orderId, order, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   // Example: compute timeline steps (assuming you have columns shipped_at, out_for_delivery_at, etc.)
//   // If you don’t have these columns, you can remove them or mock them.
//   const timelineSteps = [
//     {
//       label: 'Order Placed',
//       date: order.created_at, // typically the created_at field
//     },
//     {
//       label: 'Shipped',
//       date: order.shipped_at, // needs a shipped_at column
//     },
//     {
//       label: 'Out for Delivery',
//       date: order.out_for_delivery_at, // needs out_for_delivery_at
//     },
//     {
//       label: 'Delivered',
//       date: order.delivered_at, // needs delivered_at
//     },
//   ];

//   // Determine which step is the "current" step based on order_status
//   // (This is just an example mapping.)
//   const getCurrentStepIndex = () => {
//     switch (order.order_status) {
//       case 'Order Placed':
//         return 0;
//       case 'Shipped':
//         return 1;
//       case 'Out for Delivery':
//         return 2;
//       case 'Delivered':
//         return 3;
//       default:
//         // If Cancelled or something else, you can handle it here
//         return timelineSteps.findIndex((step) => step.label === order.order_status);
//     }
//   };

//   const currentStepIndex = getCurrentStepIndex();

//   return (
//     <div className="order-details">
//       <h1 style={{ color: '#007bff' }}>Order Details #{order.id}</h1>

//       {/* Timeline Section */}
//       <div className="order-status-timeline">
//         {timelineSteps.map((step, index) => {
//           // We mark steps as "completed" if index < currentStepIndex
//           // "active" if index === currentStepIndex
//           // "pending" if index > currentStepIndex
//           let stepClass = 'pending';
//           if (index < currentStepIndex) {
//             stepClass = 'completed';
//           } else if (index === currentStepIndex) {
//             stepClass = 'active';
//           }

//           return (
//             <div className={`timeline-step ${stepClass}`} key={step.label}>
//               <div className="timeline-icon">
//                 {/* You could use checkmarks for completed, or numbers, or icons */}
//                 {index + 1}
//               </div>
//               <div className="timeline-info">
//                 <p className="timeline-label">{step.label}</p>
//                 {step.date && (
//                   <p className="timeline-date">
//                     {new Date(step.date).toLocaleDateString('en-GB', {
//                       day: '2-digit',
//                       month: 'short',
//                       year: 'numeric',
//                     })}
//                   </p>
//                 )}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Basic Order Info */}
//       <section className="order-info">
//         <p style={{ color: '#666' }}>
//           <strong>Status:</strong> {order.order_status}
//         </p>
//         <p style={{ color: '#666' }}>
//           <strong>Total:</strong> ₹
//           {(order.total || 0).toLocaleString('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}
//         </p>
//         <p style={{ color: '#666' }}>
//           <strong>Payment Method:</strong> {order.payment_method}
//         </p>
//         <p style={{ color: '#666' }}>
//           <strong>Shipping Address:</strong>{' '}
//           {order.shipping_address || 'Not provided'}
//         </p>
//         {order.order_status === 'Cancelled' && order.cancellation_reason && (
//           <p style={{ color: '#666' }}>
//             <strong>Cancellation Reason:</strong> {order.cancellation_reason}
//           </p>
//         )}
//       </section>

//       {/* Ordered Products */}
//       <section className="order-items">
//         <h2 style={{ color: '#007bff' }}>Ordered Products</h2>
//         {order.order_items && order.order_items.length > 0 ? (
//           order.order_items.map((item) => (
//             <div
//               key={item.id}
//               className="order-item"
//               style={{
//                 border: '1px solid #ccc',
//                 padding: '10px',
//                 margin: '10px 0',
//               }}
//             >
//               <div style={{ display: 'flex', alignItems: 'center' }}>
//                 <img
//                   src={
//                     item.products?.images?.[0] ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={item.products?.title || 'Product'}
//                   onError={(e) => {
//                     e.target.src =
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                   }}
//                   style={{
//                     width: '60px',
//                     height: '60px',
//                     objectFit: 'cover',
//                     marginRight: '10px',
//                     borderRadius: '4px',
//                   }}
//                 />
//                 <div>
//                   <p style={{ color: '#666', margin: '0' }}>
//                     {item.products?.title || 'Unnamed Product'}
//                   </p>
//                   <p style={{ color: '#666', margin: '0' }}>
//                     Quantity: {item.quantity} | Price: ₹
//                     {item.products?.price?.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p style={{ color: '#666' }}>No items found for this order.</p>
//         )}
//       </section>

//       <button
//         onClick={() => navigate(-1)}
//         style={{
//           backgroundColor: '#007bff',
//           color: '#fff',
//           padding: '10px 20px',
//           border: 'none',
//           borderRadius: '5px',
//           cursor: 'pointer',
//           marginTop: '20px',
//         }}
//       >
//         Back to Orders
//       </button>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!order) {
//       const fetchOrderDetails = async () => {
//         setLoading(true);
//         try {
//           const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//           if (sessionError || !session?.user) {
//             setError('Authentication required.');
//             navigate('/auth');
//             return;
//           }

//           const { data, error } = await supabase
//             .from('orders')
//             .select(`
//               *,
//               order_items(*, products(title, price, images))
//             `)
//             .eq('id', orderId)
//             .single();

//           if (error) throw error;

//           const isBuyer = data.user_id === session.user.id;
//           const isSeller = data.seller_id === session.user.id;
//           if (!isBuyer && !isSeller) {
//             setError('You are not authorized to view this order.');
//             return;
//           }

//           setOrder(data);
//           setError(null);
//         } catch (fetchError) {
//           console.error('Error fetching order details:', fetchError);
//           setError(`Error: ${fetchError.message || 'Failed to fetch order details.'}`);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchOrderDetails();
//     }
//   }, [orderId, order, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   // Mock timeline steps (adjust based on your Supabase schema)
//   const timelineSteps = [
//     { label: 'Ordered', date: '23 Feb', icon: '📦' },
//     { label: 'Shipped', date: '25 Feb', icon: '🚚' },
//     { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
//     { label: 'Delivery', date: '04 Mar', icon: '✅' },
//   ];

//   // Determine current step based on order_status
//   const getCurrentStepIndex = () => {
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = currentStepIndex < 1; // Allow cancellation until shipped

//   return (
//     <div className="order-details">
//       {/* Header */}
//       <div className="order-details-header">
//         <span className="back-arrow" onClick={() => navigate(-1)}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call">📞</span>
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       {/* Timeline */}
//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Placed</span>
//           <span>Delivery by Tue, 04 Mar</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Cancellation */}
//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button className="cancel-button">Cancel Order</button>
//         </div>
//       )}

//       {/* Delivery Address */}
//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!order) {
//       const fetchOrderDetails = async () => {
//         setLoading(true);
//         try {
//           const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//           if (sessionError || !session?.user) {
//             setError('Authentication required.');
//             navigate('/auth');
//             return;
//           }

//           const { data, error } = await supabase
//             .from('orders')
//             .select(`
//               *,
//               order_items(*, products(title, price, images))
//             `)
//             .eq('id', orderId)
//             .single();

//           if (error) throw error;

//           const isBuyer = data.user_id === session.user.id;
//           const isSeller = data.seller_id === session.user.id;
//           if (!isBuyer && !isSeller) {
//             setError('You are not authorized to view this order.');
//             return;
//           }

//           setOrder(data);
//           setError(null);
//         } catch (fetchError) {
//           console.error('Error fetching order details:', fetchError);
//           setError(`Error: ${fetchError.message || 'Failed to fetch order details.'}`);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchOrderDetails();
//     }
//   }, [orderId, order, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   // Mock timeline steps (adjust based on your Supabase schema)
//   const timelineSteps = [
//     { label: 'Ordered', date: '23 Feb', icon: '📦' },
//     { label: 'Shipped', date: '25 Feb', icon: '🚚' },
//     { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
//     { label: 'Delivery', date: '04 Mar', icon: '✅' },
//   ];

//   // Determine current step based on order_status
//   const getCurrentStepIndex = () => {
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = currentStepIndex < 1; // Allow cancellation until shipped

//   // Navigation handlers
//   const handleBackClick = () => {
//     navigate('/account');
//   };

//   const handleSupportClick = () => {
//     navigate('/support');
//   };

//   return (
//     <div className="order-details">
//       {/* Header */}
//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       {/* Timeline */}
//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Placed</span>
//           <span>Delivery by Tue, 04 Mar</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Cancellation */}
//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button className="cancel-button">Cancel Order</button>
//         </div>
//       )}

//       {/* Delivery Address */}
//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         // Check if the user is a seller
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;

//         const isBuyer = data.user_id === session.user.id;
//         const isSellerForOrder = data.seller_id === session.user.id;
//         if (!isBuyer && !isSellerForOrder) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);
//         setError(null);
//       } catch (fetchError) {
//         console.error('Error fetching order details or user role:', fetchError);
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   // Mock timeline steps (adjust based on your Supabase schema)
//   const timelineSteps = [
//     { label: 'Ordered', date: '23 Feb', icon: '📦' },
//     { label: 'Shipped', date: '25 Feb', icon: '🚚' },
//     { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
//     { label: 'Delivery', date: '04 Mar', icon: '✅' },
//   ];

//   // Determine current step based on order_status
//   const getCurrentStepIndex = () => {
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = currentStepIndex < 1 && !isSeller; // Allow cancellation only for buyers until shipped
//   const isOrderSeller = order.seller_id === supabase.auth.getSession().then(({ data: { session } }) => session?.user.id);

//   // Navigation handlers
//   const handleBackClick = () => {
//     navigate('/account');
//   };

//   const handleSupportClick = () => {
//     navigate('/support');
//   };

//   // Function to update order status (for sellers)
//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', supabase.auth.getSession().then(({ data: { session } }) => session?.user.id));

//       if (error) throw error;

//       setOrder((prevOrder) => ({ ...prevOrder, order_status: newStatus }));
//     } catch (err) {
//       setError(`Error updating order status: ${err.message}`);
//     }
//   };

//   return (
//     <div className="order-details">
//       {/* Header */}
//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       {/* Timeline */}
//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Placed</span>
//           <span>Delivery by Tue, 04 Mar</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Actions based on role */}
//       {isSeller && isOrderSeller && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//         </div>
//       )}
//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button className="cancel-button">Cancel Order</button>
//         </div>
//       )}

//       {/* Delivery Address */}
//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;



// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/OrderDetails.css';

// function OrderDetails() {
//   const { orderId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [order, setOrder] = useState(location.state?.order || null);
//   const [loading, setLoading] = useState(!location.state?.order);
//   const [error, setError] = useState(null);
//   const [isSeller, setIsSeller] = useState(false);
//   const [reviews, setReviews] = useState([]);
//   const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
//   const [newReply, setNewReply] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);

//   useEffect(() => {
//     const fetchOrderDetailsAndRole = async () => {
//       setLoading(true);
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//         if (sessionError || !session?.user) {
//           setError('Authentication required.');
//           navigate('/auth');
//           return;
//         }

//         setCurrentUserId(session.user.id);

//         // Check if the user is a seller
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('is_seller')
//           .eq('id', session.user.id)
//           .single();
//         if (profileError) throw profileError;
//         setIsSeller(profileData.is_seller);

//         // Explicitly select user_id and seller_id
//         const { data, error } = await supabase
//           .from('orders')
//           .select(`
//             id,
//             user_id,
//             seller_id,
//             order_status,
//             total,
//             shipping_address,
//             order_items(*, products(title, price, images))
//           `)
//           .eq('id', orderId)
//           .single();

//         if (error) throw error;

//         console.log('Fetched order data:', data);
//         if (!data.user_id || !data.seller_id) {
//           throw new Error(`Order data is incomplete: user_id=${data.user_id}, seller_id=${data.seller_id}`);
//         }

//         const isBuyer = data.user_id === session.user.id;
//         const isOrderSeller = data.seller_id === session.user.id;
//         if (!isBuyer && !isOrderSeller) {
//           setError('You are not authorized to view this order.');
//           return;
//         }

//         setOrder(data);

//         // Fetch reviews for this order
//         const { data: reviewsData, error: reviewsError } = await supabase
//           .from('reviews')
//           .select(`
//             *,
//             reviewer:reviewer_id (name),
//             reviewed:reviewed_id (name)
//           `)
//           .eq('order_id', orderId);
//         if (reviewsError) throw reviewsError;
//         console.log('Fetched reviews:', reviewsData); // Debug log
//         setReviews(reviewsData || []);

//         setError(null);
//       } catch (fetchError) {
//         console.error('Error fetching order details or user role:', fetchError);
//         setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetailsAndRole();
//   }, [orderId, navigate]);

//   if (loading) return <div className="order-details-loading">Loading...</div>;
//   if (error) return <div className="order-details-error">{error}</div>;
//   if (!order) return <div className="order-details-empty">Order not found.</div>;

//   // Mock timeline steps (adjust based on your Supabase schema)
//   const timelineSteps = [
//     { label: 'Ordered', date: '23 Feb', icon: '📦' },
//     { label: 'Shipped', date: '25 Feb', icon: '🚚' },
//     { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
//     { label: 'Delivery', date: '04 Mar', icon: '✅' },
//   ];

//   // Determine current step based on order_status
//   const getCurrentStepIndex = () => {
//     const statusMap = {
//       'Order Placed': 0,
//       'Shipped': 1,
//       'Out for Delivery': 2,
//       'Delivered': 3,
//       'Cancelled': -1,
//     };
//     return statusMap[order.order_status] || 0;
//   };

//   const currentStepIndex = getCurrentStepIndex();
//   const canCancel = currentStepIndex < 1 && !isSeller;

//   // Navigation handlers
//   const handleBackClick = () => {
//     navigate('/account');
//   };

//   const handleSupportClick = () => {
//     navigate('/support');
//   };

//   // Function to update order status (for sellers)
//   const updateOrderStatus = async (newStatus) => {
//     if (!isSeller) return;

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId);

//       if (error) throw error;

//       setOrder((prevOrder) => ({ ...prevOrder, order_status: newStatus }));
//     } catch (err) {
//       setError(`Error updating order status: ${err.message}`);
//     }
//   };

//   // Function to submit a review
//   const submitReview = async () => {
//     console.log('Submitting review:', { isSeller, orderUserId: order.user_id, orderSellerId: order.seller_id });
//     const reviewerId = currentUserId;
//     let reviewedId = null;

//     if (isSeller) {
//       reviewedId = order.user_id;
//     } else {
//       reviewedId = order.seller_id;
//     }

//     if (!reviewedId) {
//       setError('Unable to determine the reviewed party. Please contact support.');
//       return;
//     }

//     if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
//       setError('Please provide a valid rating (1-5) and review text.');
//       return;
//     }

//     // Check if the user has already reviewed this order
//     const existingReview = reviews.find(
//       (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
//     );
//     if (existingReview) {
//       setError('You have already submitted a review for this order.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .insert({
//           order_id: orderId,
//           reviewer_id: reviewerId,
//           reviewed_id: reviewedId,
//           rating: newReview.rating,
//           review_text: newReview.review_text,
//         });

//       if (error) throw error;

//       // Refresh reviews
//       const { data: updatedReviews, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           *,
//           reviewer:reviewer_id (name),
//           reviewed:reviewed_id (name)
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;
//       console.log('Fetched updated reviews:', updatedReviews); // Debug log
//       setReviews(updatedReviews || []);
//       setNewReview({ rating: 0, review_text: '' });
//     } catch (err) {
//       setError(`Error submitting review: ${err.message}`);
//     }
//   };

//   // Function to submit a reply to a review
//   const submitReply = async (reviewId) => {
//     if (!newReply) {
//       setError('Please provide a reply text.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('reviews')
//         .update({ reply_text: newReply })
//         .eq('id', reviewId);

//       if (error) throw error;

//       // Refresh reviews
//       const { data: updatedReviews, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           *,
//           reviewer:reviewer_id (name),
//           reviewed:reviewed_id (name)
//         `)
//         .eq('order_id', orderId);
//       if (reviewsError) throw reviewsError;
//       console.log('Fetched updated reviews after reply:', updatedReviews); // Debug log
//       setReviews(updatedReviews || []);
//       setNewReply('');
//     } catch (err) {
//       setError(`Error submitting reply: ${err.message}`);
//     }
//   };

//   return (
//     <div className="order-details">
//       {/* Header */}
//       <div className="order-details-header">
//         <span className="back-arrow" onClick={handleBackClick}>←</span>
//         <h1>ORDER DETAILS</h1>
//         <div className="help-icons">
//           <span className="help-chat">💬</span>
//           <span className="help-call" onClick={handleSupportClick}>📞</span>
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="order-info">
//         <div className="order-item-header">
//           <img
//             src={
//               order.order_items?.[0]?.products?.images?.[0] ||
//               'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//             }
//             alt={order.order_items?.[0]?.products?.title || 'Product'}
//             onError={(e) => {
//               e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//             }}
//             className="product-image"
//           />
//           <div className="order-details-text">
//             <h2>Order #{order.id}</h2>
//             <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
//             <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//             <p>All issue easy returns</p>
//           </div>
//         </div>
//       </div>

//       {/* Timeline */}
//       <div className="order-status-timeline">
//         <div className="timeline-header">
//           <span className="status-icon">📦</span>
//           <span>Order Placed</span>
//           <span>Delivery by Tue, 04 Mar</span>
//         </div>
//         <div className="timeline-progress">
//           {timelineSteps.map((step, index) => (
//             <div key={step.label} className="timeline-step">
//               <div
//                 className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
//               >
//                 {index <= currentStepIndex ? '✅' : step.icon}
//               </div>
//               {index < timelineSteps.length - 1 && (
//                 <div
//                   className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
//                 />
//               )}
//               <div className="timeline-label">
//                 <span>{step.label}</span>
//                 <span>{step.date}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Seller Actions */}
//       {isSeller && order.seller_id === currentUserId && (
//         <div className="seller-actions">
//           <select
//             value={order.order_status}
//             onChange={(e) => updateOrderStatus(e.target.value)}
//             className="status-select"
//           >
//             {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <p>Update order status as the seller.</p>
//         </div>
//       )}

//       {/* Cancellation for Buyers */}
//       {canCancel && (
//         <div className="cancellation-section">
//           <span>Cancellation available till shipping!</span>
//           <button className="cancel-button">Cancel Order</button>
//         </div>
//       )}

//       {/* Reviews Section */}
//       <div className="reviews-section">
//         <h3>Reviews</h3>
//         {/* Display Existing Reviews */}
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.id} className="review-item">
//               <p>
//                 <strong>{review.reviewer?.name || 'Unknown User'}</strong> reviewed{' '}
//                 <strong>{review.reviewed?.name || 'Unknown User'}</strong>: {review.rating}/5
//               </p>
//               <p>{review.review_text}</p>
//               {review.reply_text ? (
//                 <p><strong>Reply:</strong> {review.reply_text}</p>
//               ) : currentUserId === review.reviewed_id ? (
//                 <div className="reply-form">
//                   <textarea
//                     value={newReply}
//                     onChange={(e) => setNewReply(e.target.value)}
//                     placeholder="Write a reply..."
//                   />
//                   <button onClick={() => submitReply(review.id)}>Submit Reply</button>
//                 </div>
//               ) : null}
//             </div>
//           ))
//         ) : (
//           <p>No reviews yet.</p>
//         )}

//         {/* Form to Submit a Review */}
//         {order.order_status === 'Delivered' && (
//           <div className="review-form">
//             <h4>Leave a Review</h4>
//             <label>
//               Rating (1-5):
//               <input
//                 type="number"
//                 min="1"
//                 max="5"
//                 value={newReview.rating}
//                 onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
//               />
//             </label>
//             <textarea
//               value={newReview.review_text}
//               onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
//               placeholder="Write your review..."
//             />
//             <button onClick={submitReview}>Submit Review</button>
//           </div>
//         )}
//       </div>

//       {/* Delivery Address */}
//       <div className="delivery-address">
//         <div className="address-header">
//           <span className="address-icon">📍</span>
//           <h3>Delivery Address</h3>
//           <span className="change-button">CHANGE</span>
//         </div>
//         <p>{order.shipping_address || 'Not provided'}</p>
//       </div>
//     </div>
//   );
// }

// export default OrderDetails;


import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../style/OrderDetails.css';

function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
  const [newReply, setNewReply] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchOrderDetailsAndRole = async () => {
      setLoading(true);
      try {
        // Step 1: Check authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          setError('Authentication required.');
          navigate('/auth');
          return;
        }

        setCurrentUserId(session.user.id);
        console.log('Current user ID:', session.user.id);

        // Step 2: Check if the user is a seller
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', session.user.id)
          .single();
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }
        setIsSeller(profileData.is_seller);
        console.log('Is seller:', profileData.is_seller);

        // Step 3: Fetch order details
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            seller_id,
            order_status,
            total,
            shipping_address,
            order_items(*, products(title, price, images))
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Order fetch error:', error);
          throw error;
        }
        if (!data) {
          throw new Error('Order not found.');
        }

        console.log('Fetched order data:', data);
        if (!data.user_id || !data.seller_id) {
          throw new Error(`Order data is incomplete: user_id=${data.user_id}, seller_id=${data.seller_id}`);
        }

        const isBuyer = data.user_id === session.user.id;
        const isOrderSeller = data.seller_id === session.user.id;
        if (!isBuyer && !isOrderSeller) {
          setError('You are not authorized to view this order.');
          return;
        }

        setOrder(data);

        // Step 4: Fetch reviews using RPC with fallback
        let reviewsData;
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
            order_id_param: parseInt(orderId),
          });
          if (rpcError) throw rpcError;
          reviewsData = rpcData;
        } catch (rpcError) {
          console.error('RPC fetch error, falling back to direct query:', rpcError);
          // Fallback: Direct query if RPC fails
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('reviews')
            .select(`
              id,
              reviewer_id,
              reviewed_id,
              rating,
              review_text,
              reply_text,
              created_at,
              updated_at
            `)
            .eq('order_id', orderId);
          if (fallbackError) throw fallbackError;
          reviewsData = fallbackData.map(review => ({
            review_id: review.id,
            reviewer_id: review.reviewer_id,
            reviewed_id: review.reviewed_id,
            rating: review.rating,
            review_text: review.review_text,
            reply_text: review.reply_text,
            created_at: review.created_at,
            updated_at: review.updated_at,
            reviewer_name: null, // Will be populated below
            reviewed_name: null,
          }));
          // Manually join with profiles for names
          const reviewerIds = reviewsData.map(r => r.reviewer_id);
          const reviewedIds = reviewsData.map(r => r.reviewed_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
          reviewsData.forEach(review => {
            const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
            const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
            review.reviewer_name = reviewerProfile?.name || 'Unknown User';
            review.reviewed_name = reviewedProfile?.name || 'Unknown User';
          });
        }
        console.log('Fetched reviews:', reviewsData);
        setReviews(reviewsData || []);

        setError(null);
      } catch (fetchError) {
        console.error('Error fetching order details or user role:', fetchError);
        setError(`Error: ${fetchError.message || 'Failed to fetch order details or user role.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetailsAndRole();
  }, [orderId, navigate]);

  // Function to determine current step based on order_status
  const getCurrentStepIndex = () => {
    if (!order) return 0; // Default to 0 if order is null
    const statusMap = {
      'Order Placed': 0,
      'Shipped': 1,
      'Out for Delivery': 2,
      'Delivered': 3,
      'Cancelled': -1,
    };
    return statusMap[order.order_status] || 0;
  };

  // Mock timeline steps (adjust based on your Supabase schema)
  const timelineSteps = [
    { label: 'Ordered', date: '23 Feb', icon: '📦' },
    { label: 'Shipped', date: '25 Feb', icon: '🚚' },
    { label: 'Out for Delivery', date: '04 Mar', icon: '📦' },
    { label: 'Delivery', date: '04 Mar', icon: '✅' },
  ];

  const currentStepIndex = getCurrentStepIndex();
  const canCancel = order && currentStepIndex < 1 && !isSeller;

  // Navigation handlers
  const handleBackClick = () => {
    navigate('/account');
  };

  const handleSupportClick = () => {
    navigate('/support');
  };

  // Function to update order status (for sellers)
  const updateOrderStatus = async (newStatus) => {
    if (!isSeller) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrder((prevOrder) => ({ ...prevOrder, order_status: newStatus }));
    } catch (err) {
      setError(`Error updating order status: ${err.message}`);
    }
  };

  // Function to submit a review
  const submitReview = async () => {
    console.log('Submitting review:', { isSeller, orderUserId: order.user_id, orderSellerId: order.seller_id });
    const reviewerId = currentUserId;
    let reviewedId = null;

    if (isSeller) {
      reviewedId = order.user_id;
    } else {
      reviewedId = order.seller_id;
    }

    if (!reviewedId) {
      setError('Unable to determine the reviewed party. Please contact support.');
      return;
    }

    if (newReview.rating < 1 || newReview.rating > 5 || !newReview.review_text) {
      setError('Please provide a valid rating (1-5) and review text.');
      return;
    }

    // Check if the user has already reviewed this order
    const existingReview = reviews.find(
      (review) => review.reviewer_id === reviewerId && review.reviewed_id === reviewedId
    );
    if (existingReview) {
      setError('You have already submitted a review for this order.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating: newReview.rating,
          review_text: newReview.review_text,
        });

      if (error) throw error;

      // Refresh reviews using RPC with fallback
      let updatedReviews;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
          order_id_param: parseInt(orderId),
        });
        if (rpcError) throw rpcError;
        updatedReviews = rpcData;
      } catch (rpcError) {
        console.error('RPC fetch error, falling back to direct query:', rpcError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select(`
            id,
            reviewer_id,
            reviewed_id,
            rating,
            review_text,
            reply_text,
            created_at,
            updated_at
          `)
          .eq('order_id', orderId);
        if (fallbackError) throw fallbackError;
        updatedReviews = fallbackData.map(review => ({
          review_id: review.id,
          reviewer_id: review.reviewer_id,
          reviewed_id: review.reviewed_id,
          rating: review.rating,
          review_text: review.review_text,
          reply_text: review.reply_text,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer_name: null,
          reviewed_name: null,
        }));
        const reviewerIds = updatedReviews.map(r => r.reviewer_id);
        const reviewedIds = updatedReviews.map(r => r.reviewed_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }
      console.log('Fetched updated reviews:', updatedReviews);
      setReviews(updatedReviews || []);
      setNewReview({ rating: 0, review_text: '' });
    } catch (err) {
      setError(`Error submitting review: ${err.message}`);
    }
  };

  // Function to submit a reply to a review
  const submitReply = async (reviewId) => {
    if (!newReply) {
      setError('Please provide a reply text.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply_text: newReply })
        .eq('id', reviewId);

      if (error) throw error;

      // Refresh reviews using RPC with fallback
      let updatedReviews;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
          order_id_param: parseInt(orderId),
        });
        if (rpcError) throw rpcError;
        updatedReviews = rpcData;
      } catch (rpcError) {
        console.error('RPC fetch error, falling back to direct query:', rpcError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reviews')
          .select(`
            id,
            reviewer_id,
            reviewed_id,
            rating,
            review_text,
            reply_text,
            created_at,
            updated_at
          `)
          .eq('order_id', orderId);
        if (fallbackError) throw fallbackError;
        updatedReviews = fallbackData.map(review => ({
          review_id: review.id,
          reviewer_id: review.reviewer_id,
          reviewed_id: review.reviewed_id,
          rating: review.rating,
          review_text: review.review_text,
          reply_text: review.reply_text,
          created_at: review.created_at,
          updated_at: review.updated_at,
          reviewer_name: null,
          reviewed_name: null,
        }));
        const reviewerIds = updatedReviews.map(r => r.reviewer_id);
        const reviewedIds = updatedReviews.map(r => r.reviewed_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', [...new Set([...reviewerIds, ...reviewedIds])]);
        updatedReviews.forEach(review => {
          const reviewerProfile = profilesData.find(p => p.id === review.reviewer_id);
          const reviewedProfile = profilesData.find(p => p.id === review.reviewed_id);
          review.reviewer_name = reviewerProfile?.name || 'Unknown User';
          review.reviewed_name = reviewedProfile?.name || 'Unknown User';
        });
      }
      console.log('Fetched updated reviews after reply:', updatedReviews);
      setReviews(updatedReviews || []);
      setNewReply('');
    } catch (err) {
      setError(`Error submitting reply: ${err.message}`);
    }
  };

  // Render checks
  if (loading) return <div className="order-details-loading">Loading...</div>;
  if (error) return <div className="order-details-error">{error}</div>;
  if (!order) return <div className="order-details-empty">Order not found.</div>;

  return (
    <div className="order-details">
      {/* Header */}
      <div className="order-details-header">
        <span className="back-arrow" onClick={handleBackClick}>←</span>
        <h1>ORDER DETAILS</h1>
        <div className="help-icons">
          <span className="help-chat">💬</span>
          <span className="help-call" onClick={handleSupportClick}>📞</span>
        </div>
      </div>

      {/* Order Info */}
      <div className="order-info">
        <div className="order-item-header">
          <img
            src={
              order.order_items?.[0]?.products?.images?.[0] ||
              'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
            }
            alt={order.order_items?.[0]?.products?.title || 'Product'}
            onError={(e) => {
              e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
            }}
            className="product-image"
          />
          <div className="order-details-text">
            <h2>Order #{order.id}</h2>
            <p>{order.order_items?.[0]?.products?.title || 'Unnamed Product'}</p>
            <p>IND-9 • Cash ₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p>All issue easy returns</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="order-status-timeline">
        <div className="timeline-header">
          <span className="status-icon">📦</span>
          <span>Order Placed</span>
          <span>Delivery by Tue, 04 Mar</span>
        </div>
        <div className="timeline-progress">
          {timelineSteps.map((step, index) => (
            <div key={step.label} className="timeline-step">
              <div
                className={`timeline-dot ${index <= currentStepIndex ? 'completed' : ''}`}
              >
                {index <= currentStepIndex ? '✅' : step.icon}
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={`timeline-line ${index < currentStepIndex ? 'completed' : ''}`}
                />
              )}
              <div className="timeline-label">
                <span>{step.label}</span>
                <span>{step.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller Actions */}
      {isSeller && order.seller_id === currentUserId && (
        <div className="seller-actions">
          <select
            value={order.order_status}
            onChange={(e) => updateOrderStatus(e.target.value)}
            className="status-select"
          >
            {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <p>Update order status as the seller.</p>
        </div>
      )}

      {/* Cancellation for Buyers */}
      {canCancel && (
        <div className="cancellation-section">
          <span>Cancellation available till shipping!</span>
          <button className="cancel-button">Cancel Order</button>
        </div>
      )}

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3>Reviews</h3>
        {/* Display Existing Reviews */}
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <p>
                <strong>{review.reviewer_name || 'Unknown User'}</strong> reviewed{' '}
                <strong>{review.reviewed_name || 'Unknown User'}</strong>: {review.rating}/5
              </p>
              <p>{review.review_text}</p>
              {review.reply_text ? (
                <p><strong>Reply:</strong> {review.reply_text}</p>
              ) : currentUserId === review.reviewed_id ? (
                <div className="reply-form">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                  />
                  <button onClick={() => submitReply(review.review_id)}>Submit Reply</button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}

        {/* Form to Submit a Review */}
        {order.order_status === 'Delivered' && (
          <div className="review-form">
            <h4>Leave a Review</h4>
            <label>
              Rating (1-5):
              <input
                type="number"
                min="1"
                max="5"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) || 0 })}
              />
            </label>
            <textarea
              value={newReview.review_text}
              onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
              placeholder="Write your review..."
            />
            <button onClick={submitReview}>Submit Review</button>
          </div>
        )}
      </div>

      {/* Delivery Address */}
      <div className="delivery-address">
        <div className="address-header">
          <span className="address-icon">📍</span>
          <h3>Delivery Address</h3>
          <span className="change-button">CHANGE</span>
        </div>
        <p>{order.shipping_address || 'Not provided'}</p>
      </div>
    </div>
  );
}

export default OrderDetails;