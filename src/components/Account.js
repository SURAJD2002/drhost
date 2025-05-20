
// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat === null || sellerLoc.lon === null) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude && sellerData.longitude) {
//           setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           if (location) checkSellerDistance({ lat: sellerData.latitude, lon: sellerData.longitude }, location);
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select(
//             `id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)`
//           )
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => ({
//           id: product.id,
//           name: product.title || 'Unnamed Product',
//           images: product.images?.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: product.price || product.product_variants?.[0]?.price || 0,
//         }));
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select(
//             `*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))`
//           )
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select(
//             `*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))`
//           )
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc) return;
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance === null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(
//         `Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`
//       );
//     } else {
//       setDistanceStatus(
//         `Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius.`
//       );
//     }
//   };

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           // Check existing seller data
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long')
//             .eq('id', user.id)
//             .single();

//           let storeNameToUse = existingSeller?.store_name || null;
//           let allowsLong = existingSeller?.allows_long || false;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//           allowsLong = allowLongInput;

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//             allow_long_input: allowsLong,
//           });

//           if (rpcError) {
//             console.error('RPC Error updating location:', rpcError);
//             setLocationMessage(`Failed to update location: ${rpcError.message || 'Unknown error'}`);
//             return;
//           }

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//             allows_long: allowsLong,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         (geoError) => {
//           console.error('Error detecting user location:', geoError);
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           const defaultLoc = { lat: 12.9753, lon: 77.591 };
//           fetchUserData(defaultLoc);
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       const defaultLoc = { lat: 12.9753, lon: 77.591 };
//       fetchUserData(defaultLoc);
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p
//                 className={`location-message ${
//                   locationMessage.includes('Error') || locationMessage.includes('Failed') ? 'error' : 'success'
//                 }`}
//               >
//                 {locationMessage}
//               </p>
//             )}
//           </div>
//         )}
//       </section>

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">My Products</h2>
//             {products.length === 0 ? (
//               <p className="no-products">You have not added any products yet.</p>
//             ) : (
//               <div className="product-grid">
//                 {products.map((product) => (
//                   <div key={product.id} className="product-card">
//                     <img
//                       src={product.images[0] || 'https://dummyimage.com/150'}
//                       alt={product.name}
//                       onError={(e) => {
//                         e.target.src = 'https://dummyimage.com/150';
//                       }}
//                     />
//                     <h3 className="product-name">{product.name}</h3>
//                     <p className="product-price">
//                       ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </p>
//                     <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                       View Product
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : null}
//       </section>

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{order.total || 0}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items && order.order_items.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={
//                                 item.products?.images?.[0] ||
//                                 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                               }
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => {
//                                 e.target.src =
//                                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                               }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{item.price || 0}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>
//                                 {status}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">
//                       View Details
//                     </Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((reason) => (
//                             <option key={reason} value={reason}>
//                               {reason}
//                             </option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{order.total || 0}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items && order.order_items.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={
//                                 item.products?.images?.[0] ||
//                                 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                               }
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => {
//                                 e.target.src =
//                                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                               }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{item.price || 0}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">
//                       View Details
//                     </Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((reason) => (
//                             <option key={reason} value={reason}>
//                               {reason}
//                             </option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">Seller Dashboard</h2>
//           <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;





// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat === null || sellerLoc.lon === null) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude && sellerData.longitude) {
//           setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           if (location) checkSellerDistance({ lat: sellerData.latitude, lon: sellerData.longitude }, location);
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc) return;
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance === null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(
//         `Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`
//       );
//     } else {
//       setDistanceStatus(
//         `Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius.`
//       );
//     }
//   };

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long')
//             .eq('id', user.id)
//             .single();

//           let storeNameToUse = existingSeller?.store_name || null;
//           let allowsLong = existingSeller?.allows_long || false;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//           allowsLong = allowLongInput;

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//             allow_long_input: allowsLong,
//           });

//           if (rpcError) throw rpcError;

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//             allows_long: allowsLong,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         () => {
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           fetchUserData({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       fetchUserData({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">Seller Dashboard</h2>
//           <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//             Go to Seller Dashboard
//           </button>
//         </section>
//       )}
//     </div>
//   );
// }

// export default Account;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat === null || sellerLoc.lon === null) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, name)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude && sellerData.longitude) {
//           setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           if (location) checkSellerDistance({ lat: sellerData.latitude, lon: sellerData.longitude }, location);
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc) return;
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance === null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(
//         `Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`
//       );
//     } else {
//       setDistanceStatus(
//         `Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius.`
//       );
//     }
//   };

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long')
//             .eq('id', user.id)
//             .single();

//           let storeNameToUse = existingSeller?.store_name || null;
//           let allowsLong = existingSeller?.allows_long || false;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//           allowsLong = allowLongInput;

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//             allow_long_input: allowsLong,
//           });

//           if (rpcError) throw rpcError;

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//             allows_long: allowsLong,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         () => {
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           fetchUserData({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       fetchUserData({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//             <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//               Go to Seller Dashboard
//             </button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchAddress = async (lat, lon) => {
//     try {
//       if (lat == null || lon == null) {
//         setAddress('Coordinates unavailable');
//         return 'Coordinates unavailable';
//       }
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       if (!response.ok) {
//         throw new Error(`Nominatim failed: ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//       return;
//     }
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance == null) {
//       setDistanceStatus('Unable to calculate distance due to invalid coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(
//         `Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`
//       );
//     } else {
//       setDistanceStatus(
//         `Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius.`
//       );
//     }
//   };

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, full_name, phone_number)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude != null && sellerData.longitude != null) {
//           const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
//           setSellerLocation(newLocation);
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           if (location) checkSellerDistance(newLocation, location);
//         } else {
//           setDistanceStatus('Seller location not set. Please update your store location.');
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long_distance')
//             .eq('id', user.id)
//             .single();
//           if (fetchError) throw fetchError;

//           let storeNameToUse = existingSeller?.store_name || null;
//           let allowsLongDistance = existingSeller?.allows_long_distance || false;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//           allowsLongDistance = allowLongInput;

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//             allow_long_input: allowsLongDistance,
//           });

//           if (rpcError) throw rpcError;

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//             allows_long_distance: allowsLongDistance,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         () => {
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           fetchUserData({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       fetchUserData({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p>Long-Distance Delivery: <span>{seller?.allows_long_distance ? 'Yes' : 'No'}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//             <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//               Go to Seller Dashboard
//             </button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {sellerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchAddress = async (lat, lon) => {
//     try {
//       if (lat == null || lon == null) {
//         setAddress('Coordinates unavailable');
//         return 'Coordinates unavailable';
//       }
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       if (!response.ok) {
//         throw new Error(`Nominatim failed: ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//       return;
//     }
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance == null) {
//       setDistanceStatus('Unable to calculate distance due to invalid coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(`Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`);
//     } else {
//       setDistanceStatus(`Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius. Products will not be visible to users beyond 40km.`);
//       // Optionally, disable product visibility or notify seller
//     }
//   };

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, full_name, phone_number)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude != null && sellerData.longitude != null) {
//           const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
//           setSellerLocation(newLocation);
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           checkSellerDistance(newLocation, location);
//         } else {
//           setDistanceStatus('Seller location not set. Please update your store location.');
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name')
//             .eq('id', user.id)
//             .single();
//           if (fetchError) throw fetchError;

//           let storeNameToUse = existingSeller?.store_name || null;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//           });

//           if (rpcError) throw rpcError;

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         () => {
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           fetchUserData({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       fetchUserData({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//             <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//               Go to Seller Dashboard
//             </button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {sellerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchAddress = async (lat, lon) => {
//     try {
//       if (lat == null || lon == null) {
//         setAddress('Coordinates unavailable');
//         return 'Coordinates unavailable';
//       }
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       if (!response.ok) {
//         throw new Error(`Nominatim failed: ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//       return;
//     }
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance == null) {
//       setDistanceStatus('Unable to calculate distance due to invalid coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(`Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`);
//     } else {
//       setDistanceStatus(`Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius. Products will not be visible to users beyond 40km.`);
//     }
//   };

//   const fetchUserData = useCallback(async (location) => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, full_name, phone_number)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude != null && sellerData.longitude != null) {
//           const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
//           setSellerLocation(newLocation);
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           checkSellerDistance(newLocation, location);
//         } else {
//           setDistanceStatus('Seller location not set. Please update your store location.');
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           // Debug: Log user ID to verify
//           console.log('User ID:', user.id);

//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name')
//             .eq('id', user.id)
//             .single();
//           if (fetchError) throw fetchError;

//           let storeNameToUse = existingSeller?.store_name || null;

//           if (!storeNameToUse) {
//             storeNameToUse = prompt('Please enter your store name:', 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//           });

//           if (rpcError) {
//             console.error('RPC Error:', rpcError);
//             throw new Error(rpcError.message || 'Failed to update seller location');
//           }

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
//           fetchUserData(userLoc);
//         },
//         () => {
//           setDistanceStatus('Could not detect your current location. Using default location.');
//           fetchUserData({ lat: 12.9753, lon: 77.591 });
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setDistanceStatus('Geolocation not supported. Using default location.');
//       fetchUserData({ lat: 12.9753, lon: 77.591 });
//     }
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//             <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//               Go to Seller Dashboard
//             </button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {sellerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.lat;
//   const lon = sellerLoc.lon;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [distanceStatus, setDistanceStatus] = useState('');

//   const navigate = useNavigate();

//   const buyerCancelReasons = [
//     'Changed my mind',
//     'Found a better price elsewhere',
//     'Item no longer needed',
//     'Other (please specify)',
//   ];
//   const sellerCancelReasons = [
//     'Out of stock',
//     'Unable to ship',
//     'Buyer request',
//     'Other (please specify)',
//   ];

//   const fetchAddress = async (lat, lon) => {
//     try {
//       if (lat == null || lon == null) {
//         setAddress('Coordinates unavailable');
//         return 'Coordinates unavailable';
//       }
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       if (!response.ok) {
//         throw new Error(`Nominatim failed: ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data && data.display_name) {
//         setAddress(data.display_name);
//         return data.display_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress('Error fetching address');
//       return 'Error fetching address';
//     }
//   };

//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     if (!userLoc || !sellerLoc || sellerLoc.lat == null || sellerLoc.lon == null || userLoc.lat == null || userLoc.lon == null) {
//       setDistanceStatus('Unable to calculate distance due to missing coordinates.');
//       return;
//     }
//     const distance = calculateDistance(userLoc, sellerLoc);
//     if (distance == null) {
//       setDistanceStatus('Unable to calculate distance due to invalid coordinates.');
//     } else if (distance <= 40) {
//       setDistanceStatus(`Your store is ${distance.toFixed(2)} km from your current location (within 40km radius).`);
//     } else {
//       setDistanceStatus(`Warning: Your store is ${distance.toFixed(2)} km away, outside the 40km radius. Products will not be visible to users beyond 40km.`);
//     }
//   };

//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         navigate('/auth');
//         return;
//       }
//       setUser(session.user);

//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();
//       if (profileError) throw profileError;
//       setProfile(profileData);

//       if (profileData.is_seller) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('*, profiles(email, full_name, phone_number)')
//           .eq('id', session.user.id)
//           .single();
//         if (sellerError) throw sellerError;
//         setSeller(sellerData);

//         if (sellerData.latitude != null && sellerData.longitude != null) {
//           const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
//           setSellerLocation(newLocation);
//           await fetchAddress(sellerData.latitude, sellerData.longitude);
//           checkSellerDistance(newLocation, buyerLocation);
//         } else {
//           setDistanceStatus('Seller location not set. Please update your store location.');
//         }

//         const { data: sellerProducts, error: sellerProductsError } = await supabase
//           .from('products')
//           .select('id, title, price, images, seller_id, product_variants (id, attributes, price, stock, images)')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (sellerProductsError) throw sellerProductsError;
//         const mappedSellerProducts = sellerProducts.map((product) => {
//           const variants = product.product_variants || [];
//           const primaryVariant = variants.length > 0 ? variants[0] : null;
//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: primaryVariant?.images?.length > 0
//               ? primaryVariant.images
//               : product.images?.length > 0
//                 ? product.images
//                 : ['https://dummyimage.com/150'],
//             price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//             variants: variants.map(variant => ({
//               id: variant.id,
//               attributes: variant.attributes,
//               price: variant.price,
//               stock: variant.stock,
//               images: variant.images,
//             })),
//           };
//         });
//         setProducts(mappedSellerProducts);

//         const { data: sellerOrders, error: sellerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         if (sellerOrdersError) throw sellerOrdersError;
//         setOrders(sellerOrders || []);
//       } else {
//         const { data: buyerOrders, error: buyerOrdersError } = await supabase
//           .from('orders')
//           .select('*, cancellation_reason, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         if (buyerOrdersError) throw buyerOrdersError;
//         setOrders(buyerOrders || []);
//         setProducts([]);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation]);

//   const handleDetectLocation = async () => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update their store location.');
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation is not supported by your browser.');
//       return;
//     }

//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLocation = { lat, lon };

//         try {
//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name')
//             .eq('id', user.id)
//             .single();
//           if (fetchError) throw fetchError;

//           let storeNameToUse = existingSeller?.store_name;
//           if (!storeNameToUse || storeNameToUse.startsWith('Store-')) {
//             storeNameToUse = prompt('Please enter your store name:', storeNameToUse || 'Default Store');
//             if (!storeNameToUse) {
//               setLocationMessage('Store name is required to set location.');
//               return;
//             }
//           }

//           const { error: rpcError } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: storeNameToUse,
//           });

//           if (rpcError) {
//             console.error('RPC Error:', rpcError);
//             throw new Error(rpcError.message || 'Failed to update seller location');
//           }

//           setSellerLocation(newLocation);
//           const newAddress = await fetchAddress(lat, lon);
//           setSeller((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//             store_name: storeNameToUse,
//           }));
//           checkSellerDistance(newLocation, buyerLocation || newLocation);
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//         } catch (err) {
//           console.error('Unexpected error updating location:', err);
//           setLocationMessage(`Unexpected error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied. Please allow location access.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out. Please try again.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: newStatus })
//         .eq('id', orderId)
//         .eq('seller_id', user.id);
//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId ? { ...order, order_status: newStatus } : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} status updated to "${newStatus}"`);
//     } catch (err) {
//       console.error('Error updating order status:', err);
//       setLocationMessage(`Error updating order status: ${err.message}`);
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select or enter a cancellation reason.');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({
//           order_status: 'Cancelled',
//           cancellation_reason: cancelReason,
//         })
//         .eq('id', orderId)
//         .match(profile?.is_seller ? { seller_id: user.id } : { user_id: user.id });

//       if (error) throw error;

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === orderId
//             ? { ...order, order_status: 'Cancelled', cancellation_reason: cancelReason }
//             : order
//         )
//       );
//       setLocationMessage(`Order #${orderId} cancelled successfully. Reason: ${cancelReason}`);
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (err) {
//       console.error('Error cancelling order:', err);
//       setLocationMessage(`Error cancelling order: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location">
//               {sellerLocation ? 'Update Location' : 'Detect & Set Location'}
//             </button>
//             {locationMessage && (
//               <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//                 {locationMessage}
//               </p>
//             )}
//             <button onClick={() => navigate('/seller')} className="btn-seller-dashboard">
//               Go to Seller Dashboard
//             </button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length === 0 ? (
//             <p className="no-products">You have not added any products yet.</p>
//           ) : (
//             <div className="product-grid">
//               {products.map((product) => (
//                 <div key={product.id} className="product-card">
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                   <h3 className="product-name">{product.name}</h3>
//                   <p className="product-price">
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   {product.variants.length > 0 && (
//                     <div className="variant-list">
//                       <h4>Variants:</h4>
//                       {product.variants.map((variant) => (
//                         <div key={variant.id} className="variant-item">
//                           <p>
//                             {Object.entries(variant.attributes)
//                               .filter(([_, value]) => value)
//                               .map(([key, value]) => `${key}: ${value}`)
//                               .join(', ')}
//                           </p>
//                           <p>Price: ₹{variant.price.toLocaleString('en-IN')}</p>
//                           <p>Stock: {variant.stock}</p>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                   <button onClick={() => navigate(`/product/${product.id}`)} className="btn-view-product">
//                     View Product
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         {profile?.is_seller ? (
//           <>
//             <h2 className="section-heading">Orders for Your Products</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">No orders have been placed on your products yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <>
//                         <div className="update-status">
//                           <label>Update Status: </label>
//                           <select
//                             value={order.order_status || 'Order Placed'}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           >
//                             {orderStatuses.map((status) => (
//                               <option key={status} value={status}>{status}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                           Cancel Order
//                         </button>
//                       </>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {sellerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             <h2 className="section-heading">My Orders</h2>
//             {orders.length === 0 ? (
//               <p className="no-orders">You have not placed any orders yet.</p>
//             ) : (
//               <div className="orders-list">
//                 {orders.map((order) => (
//                   <div key={order.id} className="order-item">
//                     <h3>Order #{order.id}</h3>
//                     <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                     <p>Status: {order.order_status || 'N/A'}</p>
//                     {order.order_status === 'Cancelled' && order.cancellation_reason && (
//                       <p>Cancellation Reason: {order.cancellation_reason}</p>
//                     )}
//                     <div className="order-products">
//                       <h4>Ordered Products</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => (
//                           <div key={`${item.product_id}-${idx}`} className="order-product">
//                             <img
//                               src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                             />
//                             <p>
//                               {item.products?.title || 'Unnamed Product'} - Quantity: {item.quantity} - Price: ₹{(item.price || 0).toLocaleString('en-IN')}
//                             </p>
//                           </div>
//                         ))
//                       ) : (
//                         <p>No product details available.</p>
//                       )}
//                     </div>
//                     {order.order_status !== 'Cancelled' && (
//                       <button onClick={() => setCancelOrderId(order.id)} className="btn-cancel-order">
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">View Details</Link>
//                     {cancelOrderId === order.id && (
//                       <div className="cancel-modal">
//                         <h3>Cancel Order #{order.id}</h3>
//                         <label>Reason for Cancellation:</label>
//                         <select
//                           value={cancelReason}
//                           onChange={(e) => {
//                             setCancelReason(e.target.value);
//                             setIsCustomReason(e.target.value === 'Other (please specify)');
//                           }}
//                         >
//                           <option value="">Select a reason</option>
//                           {buyerCancelReasons.map((reason) => (
//                             <option key={reason} value={reason}>{reason}</option>
//                           ))}
//                         </select>
//                         {isCustomReason && (
//                           <textarea
//                             value={cancelReason === 'Other (please specify)' ? '' : cancelReason}
//                             onChange={(e) => setCancelReason(e.target.value)}
//                             placeholder="Enter your custom reason"
//                           />
//                         )}
//                         <div className="cancel-modal-buttons">
//                           <button onClick={() => handleCancelOrder(order.id)} className="btn-confirm-cancel">
//                             Confirm Cancel
//                           </button>
//                           <button
//                             onClick={() => {
//                               setCancelOrderId(null);
//                               setCancelReason('');
//                               setIsCustomReason(false);
//                             }}
//                             className="btn-close-cancel"
//                           >
//                             Close
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);

//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Reverse geocode coordinates to address
//   const fetchAddress = async (lat, lon) => {
//     try {
//       const resp = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       if (!resp.ok) throw new Error(resp.statusText);
//       const data = await resp.json();
//       setAddress(data.display_name || 'Address not found');
//     } catch (e) {
//       console.error('fetchAddress error', e);
//       setAddress('Error fetching address');
//     }
//   };

//   // Determine distance status
//   const checkSellerDistance = (sellerLoc, userLoc) => {
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist == null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   };

//   // Load profile, seller info, products, orders
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude != null && sel?.longitude != null) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           await fetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation]);

//   useEffect(() => { fetchUserData(); }, [fetchUserData]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = () => {
//     if (!profile?.is_seller) return setLocationMessage('Only sellers can update location.');
//     if (!navigator.geolocation) return setLocationMessage('Geolocation not supported.');
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(async pos => {
//       const lat = pos.coords.latitude;
//       const lon = pos.coords.longitude;
//       try {
//         const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//           seller_uuid: user.id,
//           user_lat: lat,
//           user_lon: lon,
//           store_name_input: seller?.store_name || 'Store'
//         });
//         if (rpcErr) throw rpcErr;
//         const newLoc = { lat, lon };
//         setSellerLocation(newLoc);
//         await fetchAddress(lat, lon);
//         checkSellerDistance(newLoc, buyerLocation);
//         setLocationMessage('Location updated.');
//       } catch (e) {
//         console.error('detectLocation RPC error', e);
//         setLocationMessage('Error updating location.');
//       }
//     }, err => {
//       setLocationMessage('Location permission denied or timed out.');
//     }, { enableHighAccuracy: true, timeout: 10000 });
//   };

//   // Update order status
//   const updateOrderStatus = async (orderId, status) => {
//     try {
//       await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       setOrders(prev => prev.map(o => o.id===orderId?{...o, order_status:status}:o));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//     }
//   };

//   // Cancel order
//   const handleCancelOrder = async (orderId) => {
//     if (!cancelReason) return setLocationMessage('Select cancellation reason.');
//     try {
//       await supabase.from('orders').update({ order_status:'Cancelled', cancellation_reason:cancelReason })
//         .eq('id', orderId);
//       setOrders(prev => prev.map(o => o.id===orderId?{...o, order_status:'Cancelled', cancellation_reason:cancelReason}:o));
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order.');
//     }
//   };

//   if (loading) return <div className="account posa-loading">Loading...</div>;
//   if (error) return <div className="account-error">{error}</div>;

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading"><FaUser className="user-icon" /> My Profile</h2>
//         <div className="profile-info">
//           <p>Email: <span>{user?.email}</span></p>
//           <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
//           <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile">Edit Profile</Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>Store Location: <span>{address}</span></p>
//             <p className={distanceStatus.includes('Warning')?'distance-status warning':'distance-status'}>{distanceStatus}</p>
//             <button onClick={handleDetectLocation} className="btn-location">Detect/Update Location</button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <button onClick={()=>navigate('/seller')} className="btn-seller-dashboard">Go to Seller Dashboard</button>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {products.length ? (
//             <div className="product-grid">
//               {products.map(prod=>(
//                 <div key={prod.id} className="product-card">
//                   <img src={prod.images[0]||'https://dummyimage.com/150'} alt={prod.title} onError={e=>e.target.src='https://dummyimage.com/150'} />
//                   <h3>{prod.title}</h3>
//                   <p>₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product">View</Link>
//                 </div>
//               ))}
//             </div>
//           ) : <p>No products added yet.</p>}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller?'Orders Received':'My Orders'}</h2>
//         {orders.length ? (
//           <div className="orders-list">
//             {orders.map(order=>(
//               <div key={order.id} className="order-item">
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ₹{(order.total||0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status==='Cancelled'&&<p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item,idx)=>(
//                     <div key={idx} className="order-product">
//                       <img src={item.products?.images?.[0]||'https://dummyimage.com/150'} alt={item.products?.title} onError={e=>e.target.src='https://dummyimage.com/150'} />
//                       <p>{item.products?.title||'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}</p>
//                     </div>
//                   ))}
//                 </div>

//                 {order.order_status!=='Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select value={order.order_status} onChange={e=>updateOrderStatus(order.id,e.target.value)}>
//                           {orderStatuses.map(s=><option key={s} value={s}>{s}</option>)}
//                         </select>
//                       </div>
//                     ) : (
//                       <button onClick={()=>setCancelOrderId(order.id)} className="btn-cancel-order">Cancel Order</button>
//                     )}
//                     <Link to={`/order-details/${order.id}`} className="btn-view-details">Details</Link>
//                   </>
//                 )}

//                 {cancelOrderId===order.id && (
//                   <div className="cancel-modal">
//                     <h3>Cancel Order #{order.id}</h3>
//                     <select value={cancelReason} onChange={e=>{setCancelReason(e.target.value);setIsCustomReason(e.target.value==='Other (please specify)');}}>
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller? sellerCancelReasons: buyerCancelReasons).map(r=><option key={r} value={r}>{r}</option>)}
//                     </select>
//                     {isCustomReason && <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Custom reason" />}
//                     <div className="cancel-modal-buttons">
//                       <button onClick={()=>handleCancelOrder(order.id)} className="btn-confirm-cancel">Confirm</button>
//                       <button onClick={()=>{setCancelOrderId(null);setCancelReason('');setIsCustomReason(false);}} className="btn-close-cancel">Close</button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller?'No orders on your products':'You have no orders yet.'}</p>
//         )}
//       </section>
//     </div>
//   );
// }

// export default Account;



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, sellerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>
//             Email: <span>{user?.email || 'Not set'}</span>
//           </p>
//           <p>
//             Full Name: <span>{profile?.full_name || 'Not set'}</span>
//           </p>
//           <p>
//             Phone: <span>{profile?.phone_number || 'Not set'}</span>
//           </p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile" aria-label="Edit profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <img
//                     src={prod.images[0] || 'https://dummyimage.com/150'}
//                     alt={prod.title}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                   />
//                   <h3>{prod.title}</h3>
//                   <p>₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <img
//                         src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                         alt={item.products?.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       />
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]); // Only cancelReason is a dynamic dependency; state setters are stable

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>
//             Email: <span>{user?.email || 'Not set'}</span>
//           </p>
//           <p>
//             Full Name: <span>{profile?.full_name || 'Not set'}</span>
//           </p>
//           <p>
//             Phone: <span>{profile?.phone_number || 'Not set'}</span>
//           </p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile" aria-label="Edit profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <img
//                     src={prod.images[0] || 'https://dummyimage.com/150'}
//                     alt={prod.title}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                   />
//                   <h3>{prod.title}</h3>
//                   <p>₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <img
//                         src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                         alt={item.products?.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       />
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]); // Only cancelReason is a dynamic dependency; state setters are stable

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           <p>
//             Email: <span>{user?.email || 'Not set'}</span>
//           </p>
//           <p>
//             Full Name: <span>{profile?.full_name || 'Not set'}</span>
//           </p>
//           <p>
//             Phone: <span>{profile?.phone_number || 'Not set'}</span>
//           </p>
//         </div>
//         <Link to="/auth" className="btn-edit-profile" aria-label="Edit profile">
//           Edit Profile
//         </Link>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <img
//                     src={prod.images[0] || 'https://dummyimage.com/150'}
//                     alt={prod.title}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                   />
//                   <h3>{prod.title}</h3>
//                   <p>₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <img
//                         src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                         alt={item.products?.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       />
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//           </p>
//           <form>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]); // Only cancelReason is a dynamic dependency; state setters are stable

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <h1 className="account-title">FreshCart Account Dashboard</h1>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <img
//                     src={prod.images[0] || 'https://dummyimage.com/150'}
//                     alt={prod.title}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                   />
//                   <h3>{prod.title}</h3>
//                   <p>₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <img
//                         src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                         alt={item.products?.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       />
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//           </p>
//           <form>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);


// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <div className="product-image-wrapper">
//                         <img
//                           src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                           alt={item.products?.title}
//                           onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                           style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                         />
//                       </div>
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//           </p>
//           <form>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <div className="product-image-wrapper">
//                         <img
//                           src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                           alt={item.products?.title}
//                           onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                           style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                         />
//                       </div>
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : order.order_status !== 'Cancelled' && (
//                   <>
//                     {profile?.is_seller ? (
//                       <div className="update-status">
//                         <label>Update Status:</label>
//                         <select
//                           value={order.order_status}
//                           onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                           aria-label={`Update status for order ${order.id}`}
//                         >
//                           {orderStatuses.map((s) => (
//                             <option key={s} value={s}>
//                               {s}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => setCancelOrderId(order.id)}
//                         className="btn-cancel-order"
//                         aria-label={`Cancel order ${order.id}`}
//                       >
//                         Cancel Order
//                       </button>
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         const { data: sOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('seller_id', session.user.id);
//         setOrders(sOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.map((item, idx) => (
//                     <div key={idx} className="order-product">
//                       <div className="product-image-wrapper">
//                         <img
//                           src={item.products?.images?.[0] || 'https://dummyimage.com/150'}
//                           alt={item.products?.title}
//                           onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                           style={{ maxWidth: '100%', height: 'auto' }} // Ensure image fits
//                         />
//                       </div>
//                       <p>
//                         {item.products?.title || 'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <div className="update-status">
//                           <label>Update Status:</label>
//                           <select
//                             value={order.order_status}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                             aria-label={`Update status for order ${order.id}`}
//                           >
//                             {orderStatuses.map((s) => (
//                               <option key={s} value={s}>
//                                 {s}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       ) : null
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         // Fetch orders without product_variants initially
//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             )
//           `)
//           .eq('seller_id', session.user.id);
//         if (orderError) throw orderError;

//         // Fetch product_variants separately
//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));

//         console.log('Fetched Seller Orders with Variants:', updatedOrders); // Debug log
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }}
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.length > 0 ? (
//                     order.order_items.map((item, idx) => {
//                       const variant = item.variant_id && Array.isArray(item.product_variants)
//                         ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                         : null;
//                       const variantAttributes = variant?.attributes
//                         ? Object.entries(variant.attributes)
//                             .filter(([key, val]) => val)
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')
//                         : null;
//                       const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                         ? variant.images
//                         : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                         ? item.products.images
//                         : ['https://dummyimage.com/150'];
//                       const displayPrice = variant?.price || item.price;

//                       return (
//                         <div key={idx} className="order-product">
//                           <div className="product-image-wrapper">
//                             <img
//                               src={displayImages[0]}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                               style={{ maxWidth: '100%', height: 'auto' }}
//                             />
//                           </div>
//                           <div className="order-product-details">
//                             <p>
//                               {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                             </p>
//                             {variantAttributes ? (
//                               <p className="variant-details">
//                                 Variant: {variantAttributes}
//                               </p>
//                             ) : (
//                               <p className="variant-details">
//                                 No variant selected
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })
//                   ) : (
//                     <p>No items in this order.</p>
//                   )}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <div className="update-status">
//                           <label>Update Status:</label>
//                           <select
//                             value={order.order_status}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                             aria-label={`Update status for order ${order.id}`}
//                           >
//                             {orderStatuses.map((s) => (
//                               <option key={s} value={s}>
//                                 {s}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       ) : null
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         // Fetch orders with estimated_delivery
//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             )
//           `)
//           .eq('seller_id', session.user.id);
//         if (orderError) throw orderError;

//         // Fetch product_variants separately
//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));

//         console.log('Fetched Seller Orders with Variants:', updatedOrders); // Debug log
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, estimated_delivery, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }}
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                 {order.estimated_delivery && (
//                   <p>
//                     Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                       year: 'numeric',
//                       month: '2-digit',
//                       day: '2-digit',
//                       hour: '2-digit',
//                       minute: '2-digit',
//                       hour12: false,
//                     })}
//                   </p>
//                 )}

//                 <div className="order-products">
//                   <h4>Items:</h4>
//                   {order.order_items?.length > 0 ? (
//                     order.order_items.map((item, idx) => {
//                       const variant = item.variant_id && Array.isArray(item.product_variants)
//                         ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                         : null;
//                       const variantAttributes = variant?.attributes
//                         ? Object.entries(variant.attributes)
//                             .filter(([key, val]) => val)
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')
//                         : null;
//                       const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                         ? variant.images
//                         : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                         ? item.products.images
//                         : ['https://dummyimage.com/150'];
//                       const displayPrice = variant?.price || item.price;

//                       return (
//                         <div key={idx} className="order-product">
//                           <div className="product-image-wrapper">
//                             <img
//                               src={displayImages[0]}
//                               alt={item.products?.title || 'Product'}
//                               onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                               style={{ maxWidth: '100%', height: 'auto' }}
//                             />
//                           </div>
//                           <div className="order-product-details">
//                             <p>
//                               {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                             </p>
//                             {variantAttributes ? (
//                               <p className="variant-details">
//                                 Variant: {variantAttributes}
//                               </p>
//                             ) : (
//                               <p className="variant-details">
//                                 No variant selected
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })
//                   ) : (
//                     <p>No items in this order.</p>
//                   )}
//                 </div>

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <div className="update-status">
//                           <label>Update Status:</label>
//                           <select
//                             value={order.order_status}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                             aria-label={`Update status for order ${order.id}`}
//                           >
//                             {orderStatuses.map((s) => (
//                               <option key={s} value={s}>
//                                 {s}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       ) : null
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         // Fetch all orders for sellers (including EMI)
//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id);
//         if (orderError) throw orderError;

//         // Fetch product_variants separately
//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));

//         console.log('Fetched Seller Orders with Variants:', updatedOrders); // Debug log
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, estimated_delivery, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }}
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                 {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                   <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                 )}
//                 {order.estimated_delivery && (
//                   <p>
//                     Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                       year: 'numeric',
//                       month: '2-digit',
//                       day: '2-digit',
//                       hour: '2-digit',
//                       minute: '2-digit',
//                       hour12: false,
//                     })}
//                   </p>
//                 )}
//                 {order.payment_method === 'emi' ? (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     <div className="order-product">
//                       <div className="order-product-details">
//                         <p>
//                           {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                         </p>
//                         {profile?.is_seller && (
//                           <>
//                             <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                             <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     {order.order_items?.length > 0 ? (
//                       order.order_items.map((item, idx) => {
//                         const variant = item.variant_id && Array.isArray(item.product_variants)
//                           ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                           : null;
//                         const variantAttributes = variant?.attributes
//                           ? Object.entries(variant.attributes)
//                               .filter(([key, val]) => val)
//                               .map(([key, val]) => `${key}: ${val}`)
//                               .join(', ')
//                           : null;
//                         const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                           ? variant.images
//                           : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                           ? item.products.images
//                           : ['https://dummyimage.com/150'];
//                         const displayPrice = variant?.price || item.price;

//                         return (
//                           <div key={idx} className="order-product">
//                             <div className="product-image-wrapper">
//                               <img
//                                 src={displayImages[0]}
//                                 alt={item.products?.title || 'Product'}
//                                 onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                 style={{ maxWidth: '100%', height: 'auto' }}
//                               />
//                             </div>
//                             <div className="order-product-details">
//                               <p>
//                                 {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                               </p>
//                               {variantAttributes ? (
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                               ) : (
//                                 <p className="variant-details">
//                                   No variant selected
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p>No items in this order.</p>
//                     )}
//                   </div>
//                 )}

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <div className="update-status">
//                           <label>Update Status:</label>
//                           <select
//                             value={order.order_status}
//                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                             aria-label={`Update status for order ${order.id}`}
//                           >
//                             {orderStatuses.map((s) => (
//                               <option key={s} value={s}>
//                                 {s}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       ) : null
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({}); // Track EMI status updates
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw profErr;
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [] } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         setProducts(prods);

//         // Fetch all orders for sellers (including EMI)
//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id);
//         if (orderError) throw orderError;

//         // Fetch product_variants separately
//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw variantError;
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));

//         console.log('Fetched Seller Orders with Variants:', updatedOrders); // Debug log
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [] } = await supabase
//           .from('orders')
//           .select('*, estimated_delivery, order_items (product_id, quantity, price, products (id, title, images))')
//           .eq('user_id', session.user.id);
//         setOrders(bOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError('Failed to load account. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       // Update EMI application status
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       // Update order status based on EMI status
//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('Sorry, the EMI application has been rejected. We apologize for the inconvenience.');
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       // Update local state
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }}
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                 {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                   <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                 )}
//                 {order.estimated_delivery && (
//                   <p>
//                     Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                       year: 'numeric',
//                       month: '2-digit',
//                       day: '2-digit',
//                       hour: '2-digit',
//                       minute: '2-digit',
//                       hour12: false,
//                     })}
//                   </p>
//                 )}
//                 {order.payment_method === 'emi' ? (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     <div className="order-product">
//                       <div className="order-product-details">
//                         <p>
//                           {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                         </p>
//                         {profile?.is_seller && (
//                           <>
//                             <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                             <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     {order.order_items?.length > 0 ? (
//                       order.order_items.map((item, idx) => {
//                         const variant = item.variant_id && Array.isArray(item.product_variants)
//                           ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                           : null;
//                         const variantAttributes = variant?.attributes
//                           ? Object.entries(variant.attributes)
//                               .filter(([key, val]) => val)
//                               .map(([key, val]) => `${key}: ${val}`)
//                               .join(', ')
//                           : null;
//                         const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                           ? variant.images
//                           : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                           ? item.products.images
//                           : ['https://dummyimage.com/150'];
//                         const displayPrice = variant?.price || item.price;

//                         return (
//                           <div key={idx} className="order-product">
//                             <div className="product-image-wrapper">
//                               <img
//                                 src={displayImages[0]}
//                                 alt={item.products?.title || 'Product'}
//                                 onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                 style={{ maxWidth: '100%', height: 'auto' }}
//                               />
//                             </div>
//                             <div className="order-product-details">
//                               <p>
//                                 {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                               </p>
//                               {variantAttributes ? (
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                               ) : (
//                                 <p className="variant-details">
//                                   No variant selected
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p>No items in this order.</p>
//                     )}
//                   </div>
//                 )}

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       <>
//                         {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                           <div className="update-emi-status">
//                             <label>Update EMI Status:</label>
//                             <select
//                               value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                               onChange={(e) => {
//                                 const newStatus = e.target.value;
//                                 setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                 updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                               }}
//                               aria-label={`Update EMI status for order ${order.id}`}
//                             >
//                               {emiStatuses.map((s) => (
//                                 <option key={s} value={s}>
//                                   {s.charAt(0).toUpperCase() + s.slice(1)}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         )}
//                         {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                           <div className="update-status">
//                             <label>Update Status:</label>
//                             <select
//                               value={order.order_status}
//                               onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                               aria-label={`Update status for order ${order.id}`}
//                             >
//                               {orderStatuses.map((s) => (
//                                 <option key={s} value={s}>
//                                   {s}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         )}
//                       </>
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
//   const navigate = useNavigate();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel, error: selErr } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [], error: prodErr } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true);
//         if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
//         setProducts(prods);

//         // Fetch all orders for sellers (including EMI)
//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id);
//         if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

//         // Fetch product_variants separately
//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
//           variantData = variants || [];
//         }

//         // Attach product_variants to order_items
//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));

//         console.log('Fetched Seller Orders with Variants:', updatedOrders); // Debug log
//         setOrders(updatedOrders);
//       } else {
//         // Fetch orders for buyers
//         const { data: bOrders = [], error: buyerOrderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status,
//               seller_name
//             ),
//             profiles!orders_seller_id_fkey (
//               id
//             )
//           `)
//           .eq('user_id', session.user.id);
//         if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

//         // Fetch sellers data separately to get store_name
//         const sellerProfileIds = [...new Set(bOrders.map(order => order.profiles?.id).filter(id => id))];
//         let sellersData = [];
//         if (sellerProfileIds.length > 0) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .in('id', sellerProfileIds);
//           if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
//           sellersData = sellers || [];
//         }

//         // Attach sellers data to orders
//         const updatedOrders = bOrders.map(order => ({
//           ...order,
//           sellers: sellersData.find(seller => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
//         }));

//         setOrders(updatedOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser.');
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try again.');
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError('Failed to update order status.');
//     }
//   }, []);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       // Update EMI application status
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       // Update order status based on EMI status
//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('Sorry, the EMI application has been rejected. We apologize for the inconvenience.');
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       // Update local state
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, []);

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <div className="product-grid">
//               {products.map((prod) => (
//                 <div key={prod.id} className="product-card">
//                   <div className="product-image-wrapper">
//                     <img
//                       src={prod.images[0] || 'https://dummyimage.com/150'}
//                       alt={prod.title}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                       style={{ maxWidth: '100%', height: 'auto' }}
//                     />
//                   </div>
//                   <h3 className="product-name">{prod.title}</h3>
//                   <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                   <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                     View
//                   </Link>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <div className="orders-list">
//             {displayedOrders.map((order) => (
//               <div key={order.id} className="order-item">
//                 <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status}</p>
//                 {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                 {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                   <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                 )}
//                 {order.estimated_delivery && (
//                   <p>
//                     Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                       year: 'numeric',
//                       month: '2-digit',
//                       day: '2-digit',
//                       hour: '2-digit',
//                       minute: '2-digit',
//                       hour12: false,
//                     })}
//                   </p>
//                 )}
//                 {order.payment_method === 'emi' ? (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     <div className="order-product">
//                       <div className="order-product-details">
//                         <p>
//                           {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                         </p>
//                         {profile?.is_seller && (
//                           <>
//                             <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                             <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                           </>
//                         )}
//                         {!profile?.is_seller && order.sellers?.store_name && (
//                           <p>Seller: {order.sellers.store_name}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="order-products">
//                     <h4>Items:</h4>
//                     {order.order_items?.length > 0 ? (
//                       order.order_items.map((item, idx) => {
//                         const variant = item.variant_id && Array.isArray(item.product_variants)
//                           ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                           : null;
//                         const variantAttributes = variant?.attributes
//                           ? Object.entries(variant.attributes)
//                               .filter(([key, val]) => val)
//                               .map(([key, val]) => `${key}: ${val}`)
//                               .join(', ')
//                           : null;
//                         const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                           ? variant.images
//                           : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                           ? item.products.images
//                           : ['https://dummyimage.com/150'];
//                         const displayPrice = variant?.price || item.price;

//                         return (
//                           <div key={idx} className="order-product">
//                             <div className="product-image-wrapper">
//                               <img
//                                 src={displayImages[0]}
//                                 alt={item.products?.title || 'Product'}
//                                 onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                 style={{ maxWidth: '100%', height: 'auto' }}
//                               />
//                             </div>
//                             <div className="order-product-details">
//                               <p>
//                                 {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                               </p>
//                               {variantAttributes ? (
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                               ) : (
//                                 <p className="variant-details">
//                                   No variant selected
//                                 </p>
//                               )}
//                               {!profile?.is_seller && order.sellers?.store_name && (
//                                 <p>Seller: {order.sellers.store_name}</p>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p>No items in this order.</p>
//                     )}
//                   </div>
//                 )}

//                 {String(order.id).startsWith('skeleton-') ? null : (
//                   <>
//                     {profile?.is_seller ? (
//                       <>
//                         {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                           <div className="update-emi-status">
//                             <label>Update EMI Status:</label>
//                             <select
//                               value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                               onChange={(e) => {
//                                 const newStatus = e.target.value;
//                                 setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                 updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                               }}
//                               aria-label={`Update EMI status for order ${order.id}`}
//                             >
//                               {emiStatuses.map((s) => (
//                                 <option key={s} value={s}>
//                                   {s.charAt(0).toUpperCase() + s.slice(1)}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         )}
//                         {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                           <div className="update-status">
//                             <label>Update Status:</label>
//                             <select
//                               value={order.order_status}
//                               onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                               aria-label={`Update status for order ${order.id}`}
//                             >
//                               {orderStatuses.map((s) => (
//                                 <option key={s} value={s}>
//                                   {s}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         )}
//                       </>
//                     ) : (
//                       order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                         <button
//                           onClick={() => setCancelOrderId(order.id)}
//                           className="btn-cancel-order"
//                           aria-label={`Cancel order ${order.id}`}
//                         >
//                           Cancel Order
//                         </button>
//                       ) : null
//                     )}
//                     <Link
//                       to={`/order-details/${order.id}`}
//                       className="btn-view-details"
//                       aria-label={`View details for order ${order.id}`}
//                     >
//                       Details
//                     </Link>
//                   </>
//                 )}

//                 {cancelOrderId === order.id && (
//                   <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                     <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                     <select
//                       value={cancelReason}
//                       onChange={(e) => {
//                         setCancelReason(e.target.value);
//                         setIsCustomReason(e.target.value === 'Other (please specify)');
//                       }}
//                       aria-label="Select cancellation reason"
//                     >
//                       <option value="">Select reason</option>
//                       {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                         <option key={r} value={r}>
//                           {r}
//                         </option>
//                       ))}
//                     </select>
//                     {isCustomReason && (
//                       <textarea
//                         value={cancelReason}
//                         onChange={(e) => setCancelReason(e.target.value)}
//                         placeholder="Custom reason"
//                         aria-label="Custom cancellation reason"
//                         className="custom-reason-input"
//                       />
//                     )}
//                     <div className="cancel-modal-buttons">
//                       <button
//                         onClick={() => handleCancelOrder(order.id)}
//                         className="btn-confirm-cancel"
//                         aria-label="Confirm order cancellation"
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => {
//                           setCancelOrderId(null);
//                           setCancelReason('');
//                           setIsCustomReason(false);
//                         }}
//                         className="btn-close-cancel"
//                         aria-label="Close cancellation modal"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={(e) => e.preventDefault()}>
//             <textarea placeholder="Describe your issue..." className="support-input" style={{ color: '#666' }} />
//             <button className="support-btn">Submit</button>
//           </form>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [supportMessage, setSupportMessage] = useState('');
//   const [productsPage, setProductsPage] = useState(1);
//   const [ordersPage, setOrdersPage] = useState(1);
//   const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
//   const [retryOrderId, setRetryOrderId] = useState(null);
//   const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
//   const ITEMS_PER_PAGE = 5;
//   const navigate = useNavigate();
//   const location = useLocation();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];
//   const paymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];

//   // Order status transitions
//   const validTransitions = {
//     'Order Placed': ['Shipped', 'Cancelled'],
//     'Shipped': ['Out for Delivery', 'Cancelled'],
//     'Out for Delivery': ['Delivered', 'Cancelled'],
//     'Delivered': [],
//     'Cancelled': [],
//   };

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel, error: selErr } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [], error: prodErr } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true)
//           .range((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE - 1);
//         if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
//         setProducts(prods);

//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
//           variantData = variants || [];
//         }

//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [], error: buyerOrderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status,
//               seller_name
//             ),
//             profiles!orders_seller_id_fkey (
//               id
//             )
//           `)
//           .eq('user_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

//         const sellerProfileIds = [...new Set(bOrders.map(order => order.profiles?.id).filter(id => id))];
//         let sellersData = [];
//         if (sellerProfileIds.length > 0) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .in('id', sellerProfileIds);
//           if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
//           sellersData = sellers || [];
//         }

//         const updatedOrders = bOrders.map(order => ({
//           ...order,
//           sellers: sellersData.find(seller => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
//         }));
//         setOrders(updatedOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance, productsPage, ordersPage]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Update seller location manually
//   const handleManualLocationUpdate = useCallback(async () => {
//     if (!manualLat || !manualLon) {
//       setLocationMessage('Please enter both latitude and longitude.');
//       return;
//     }
//     const lat = parseFloat(manualLat);
//     const lon = parseFloat(manualLon);
//     if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setLocationMessage('Invalid latitude or longitude values.');
//       return;
//     }
//     try {
//       const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//         seller_uuid: user.id,
//         user_lat: lat,
//         user_lon: lon,
//         store_name_input: seller?.store_name || 'Store',
//       });
//       if (rpcErr) throw rpcErr;
//       const newLoc = { lat, lon };
//       setSellerLocation(newLoc);
//       debouncedFetchAddress(lat, lon);
//       checkSellerDistance(newLoc, buyerLocation);
//       setLocationMessage('Location updated successfully.');
//       setShowManualLocation(false);
//       setManualLat('');
//       setManualLon('');
//     } catch (e) {
//       console.error('manualLocationUpdate error', e);
//       setLocationMessage('Error updating location. Please try again.');
//     }
//   }, [manualLat, manualLon, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
//       setShowManualLocation(true);
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try manually.');
//           setShowManualLocation(true);
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out. Please enter manually.');
//         setShowManualLocation(true);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const currentOrder = orders.find(o => o.id === orderId);
//       const currentStatus = currentOrder.order_status;
//       if (!validTransitions[currentStatus]?.includes(status)) {
//         throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
//       }
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//     } catch (e) {
//       console.error('updateOrderStatus error', e);
//       setError(`Failed to update order status: ${e.message}`);
//     }
//   }, [orders]);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('EMI application rejected. Notifying buyer to retry with a different payment method.');
//         setRetryOrderId(orderId);
//         setShowRetryPaymentModal(true);
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, [orders]);

//   // Retry payment with a different method
//   const handleRetryPayment = async () => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ payment_method: newPaymentMethod, order_status: 'Order Placed', updated_at: new Date().toISOString() })
//         .eq('id', retryOrderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === retryOrderId
//             ? { ...o, payment_method: newPaymentMethod, order_status: 'Order Placed' }
//             : o
//         )
//       );
//       setShowRetryPaymentModal(false);
//       setRetryOrderId(null);
//       setNewPaymentMethod('credit_card');
//       setLocationMessage('Payment method updated successfully. Order placed.');
//     } catch (e) {
//       console.error('retryPayment error', e);
//       setLocationMessage('Failed to update payment method. Please try again.');
//     }
//   };

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Handle support form submission
//   const handleSupportSubmit = async (e) => {
//     e.preventDefault();
//     if (!supportMessage.trim()) {
//       setLocationMessage('Please enter a support message.');
//       return;
//     }
//     try {
//       const { error } = await supabase.from('support_requests').insert({
//         user_id: session.user.id,
//         message: supportMessage,
//         created_at: new Date().toISOString(),
//       });
//       if (error) throw error;
//       setSupportMessage('');
//       setLocationMessage('Support request submitted successfully.');
//     } catch (e) {
//       console.error('supportSubmit error', e);
//       setLocationMessage('Failed to submit support request. Please try again.');
//     }
//   };

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   useEffect(() => {
//     if (location.state?.newOrderIds) {
//       setLocationMessage('New orders placed successfully! Check below.');
//     }
//   }, [location.state]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {showManualLocation && (
//               <div style={{ marginTop: '15px' }}>
//                 <p>Enter location manually:</p>
//                 <input
//                   type="number"
//                   value={manualLat}
//                   onChange={(e) => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <input
//                   type="number"
//                   value={manualLon}
//                   onChange={(e) => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <button onClick={handleManualLocationUpdate} className="btn-location">
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <>
//               <div className="product-grid">
//                 {products.map((prod) => (
//                   <div key={prod.id} className="product-card">
//                     <div className="product-image-wrapper">
//                       <img
//                         src={prod.images[0] || 'https://dummyimage.com/150'}
//                         alt={prod.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                         style={{ maxWidth: '100%', height: 'auto' }}
//                       />
//                     </div>
//                     <h3 className="product-name">{prod.title}</h3>
//                     <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                     <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                       View
//                     </Link>
//                   </div>
//                 ))}
//               </div>
//               <div style={{ marginTop: '20px', textAlign: 'center' }}>
//                 <button
//                   onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={productsPage === 1}
//                   style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => setProductsPage((prev) => prev + 1)}
//                   disabled={products.length < ITEMS_PER_PAGE}
//                   style={{ padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <>
//             <div className="orders-list">
//               {displayedOrders.map((order) => (
//                 <div key={order.id} className="order-item">
//                   <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                   <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                   <p>Status: {order.order_status}</p>
//                   {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                   {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                     <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                   )}
//                   {order.estimated_delivery && (
//                     <p>
//                       Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: false,
//                       })}
//                     </p>
//                   )}
//                   {order.payment_method === 'emi' ? (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       <div className="order-product">
//                         <div className="order-product-details">
//                           <p>
//                             {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                           </p>
//                           {profile?.is_seller && (
//                             <>
//                               <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                               <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                             </>
//                           )}
//                           {!profile?.is_seller && order.sellers?.store_name && (
//                             <p>Seller: {order.sellers.store_name}</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => {
//                           const variant = item.variant_id && Array.isArray(item.product_variants)
//                             ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                             : null;
//                           const variantAttributes = variant?.attributes
//                             ? Object.entries(variant.attributes)
//                                 .filter(([key, val]) => val)
//                                 .map(([key, val]) => `${key}: ${val}`)
//                                 .join(', ') || 'No variant details available'
//                             : 'No variant selected';
//                           const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                             ? variant.images
//                             : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                             ? item.products.images
//                             : ['https://dummyimage.com/150'];
//                           const displayPrice = variant?.price || item.price;

//                           return (
//                             <div key={idx} className="order-product">
//                               <div className="product-image-wrapper">
//                                 <img
//                                   src={displayImages[0]}
//                                   alt={item.products?.title || 'Product'}
//                                   onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                   style={{ maxWidth: '100%', height: 'auto' }}
//                                 />
//                               </div>
//                               <div className="order-product-details">
//                                 <p>
//                                   {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                                 </p>
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                                 {!profile?.is_seller && order.sellers?.store_name && (
//                                   <p>Seller: {order.sellers.store_name}</p>
//                                 )}
//                               </div>
//                             </div>
//                           );
//                         })
//                       ) : (
//                         <p>No items in this order.</p>
//                       )}
//                     </div>
//                   )}

//                   {String(order.id).startsWith('skeleton-') ? null : (
//                     <>
//                       {profile?.is_seller ? (
//                         <>
//                           {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                             <div className="update-emi-status">
//                               <label>Update EMI Status:</label>
//                               <select
//                                 value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                                 onChange={(e) => {
//                                   const newStatus = e.target.value;
//                                   setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                   updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                                 }}
//                                 aria-label={`Update EMI status for order ${order.id}`}
//                               >
//                                 {emiStatuses.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                           {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                             <div className="update-status">
//                               <label>Update Status:</label>
//                               <select
//                                 value={order.order_status}
//                                 onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                                 aria-label={`Update status for order ${order.id}`}
//                               >
//                                 {orderStatuses.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                           <button
//                             onClick={() => setCancelOrderId(order.id)}
//                             className="btn-cancel-order"
//                             aria-label={`Cancel order ${order.id}`}
//                           >
//                             Cancel Order
//                           </button>
//                         ) : null
//                       )}
//                       <Link
//                         to={`/order-details/${order.id}`}
//                         className="btn-view-details"
//                         aria-label={`View details for order ${order.id}`}
//                       >
//                         Details
//                       </Link>
//                     </>
//                   )}

//                   {cancelOrderId === order.id && (
//                     <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                       <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                       <select
//                         value={cancelReason}
//                         onChange={(e) => {
//                           setCancelReason(e.target.value);
//                           setIsCustomReason(e.target.value === 'Other (please specify)');
//                         }}
//                         aria-label="Select cancellation reason"
//                       >
//                         <option value="">Select reason</option>
//                         {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                           <option key={r} value={r}>
//                             {r}
//                           </option>
//                         ))}
//                       </select>
//                       {isCustomReason && (
//                         <textarea
//                           value={cancelReason}
//                           onChange={(e) => setCancelReason(e.target.value)}
//                           placeholder="Custom reason"
//                           aria-label="Custom cancellation reason"
//                           className="custom-reason-input"
//                         />
//                       )}
//                       <div className="cancel-modal-buttons">
//                         <button
//                           onClick={() => handleCancelOrder(order.id)}
//                           className="btn-confirm-cancel"
//                           aria-label="Confirm order cancellation"
//                         >
//                           Confirm
//                         </button>
//                         <button
//                           onClick={() => {
//                             setCancelOrderId(null);
//                             setCancelReason('');
//                             setIsCustomReason(false);
//                           }}
//                           className="btn-close-cancel"
//                           aria-label="Close cancellation modal"
//                         >
//                           Close
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div style={{ marginTop: '20px', textAlign: 'center' }}>
//               <button
//                 onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={ordersPage === 1}
//                 style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => setOrdersPage((prev) => prev + 1)}
//                 disabled={orders.length < ITEMS_PER_PAGE}
//                 style={{ padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Next
//               </button>
//             </div>
//           </>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={handleSupportSubmit}>
//             <textarea
//               placeholder="Describe your issue..."
//               className="support-input"
//               style={{ color: '#666' }}
//               value={supportMessage}
//               onChange={(e) => setSupportMessage(e.target.value)}
//             />
//             <button className="support-btn" type="submit">Submit</button>
//           </form>
//         </div>
//       </section>

//       {showRetryPaymentModal && (
//         <div className="cancel-modal" role="dialog" aria-labelledby="retry-payment-modal">
//           <h3 id="retry-payment-modal">Retry Payment for Order #{retryOrderId}</h3>
//           <p>EMI application was rejected. Please select a different payment method to proceed.</p>
//           <select
//             value={newPaymentMethod}
//             onChange={(e) => setNewPaymentMethod(e.target.value)}
//             aria-label="Select new payment method"
//           >
//             {paymentMethods.map((method) => (
//               <option key={method} value={method}>
//                 {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
//               </option>
//             ))}
//           </select>
//           <div className="cancel-modal-buttons">
//             <button onClick={handleRetryPayment} className="btn-confirm-cancel">
//               Confirm Payment
//             </button>
//             <button
//               onClick={() => setShowRetryPaymentModal(false)}
//               className="btn-close-cancel"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(Account);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [supportMessage, setSupportMessage] = useState('');
//   const [productsPage, setProductsPage] = useState(1);
//   const [ordersPage, setOrdersPage] = useState(1);
//   const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
//   const [retryOrderId, setRetryOrderId] = useState(null);
//   const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
//   const ITEMS_PER_PAGE = 5;
//   const navigate = useNavigate();
//   const location = useLocation();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];
//   const paymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];

//   // Order status transitions
//   const validTransitions = {
//     'Order Placed': ['Shipped', 'Cancelled'],
//     'Shipped': ['Out for Delivery', 'Cancelled'],
//     'Out for Delivery': ['Delivered', 'Cancelled'],
//     'Delivered': [],
//     'Cancelled': [],
//   };

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel, error: selErr } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [], error: prodErr } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true)
//           .range((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE - 1);
//         if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
//         setProducts(prods);

//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
//           variantData = variants || [];
//         }

//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [], error: buyerOrderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status,
//               seller_name
//             ),
//             profiles!orders_seller_id_fkey (
//               id
//             )
//           `)
//           .eq('user_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

//         const sellerProfileIds = [...new Set(bOrders.map(order => order.profiles?.id).filter(id => id))];
//         let sellersData = [];
//         if (sellerProfileIds.length > 0) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .in('id', sellerProfileIds);
//           if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
//           sellersData = sellers || [];
//         }

//         const updatedOrders = bOrders.map(order => ({
//           ...order,
//           sellers: sellersData.find(seller => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
//         }));
//         setOrders(updatedOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance, productsPage, ordersPage]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Update seller location manually
//   const handleManualLocationUpdate = useCallback(async () => {
//     if (!manualLat || !manualLon) {
//       setLocationMessage('Please enter both latitude and longitude.');
//       return;
//     }
//     const lat = parseFloat(manualLat);
//     const lon = parseFloat(manualLon);
//     if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setLocationMessage('Invalid latitude or longitude values.');
//       return;
//     }
//     try {
//       const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//         seller_uuid: user.id,
//         user_lat: lat,
//         user_lon: lon,
//         store_name_input: seller?.store_name || 'Store',
//       });
//       if (rpcErr) throw rpcErr;
//       const newLoc = { lat, lon };
//       setSellerLocation(newLoc);
//       debouncedFetchAddress(lat, lon);
//       checkSellerDistance(newLoc, buyerLocation);
//       setLocationMessage('Location updated successfully.');
//       setShowManualLocation(false);
//       setManualLat('');
//       setManualLon('');
//     } catch (e) {
//       console.error('manualLocationUpdate error', e);
//       setLocationMessage('Error updating location. Please try again.');
//     }
//   }, [manualLat, manualLon, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
//       setShowManualLocation(true);
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try manually.');
//           setShowManualLocation(true);
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out. Please enter manually.');
//         setShowManualLocation(true);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const currentOrder = orders.find(o => o.id === orderId);
//       const currentStatus = currentOrder.order_status;
//       if (!validTransitions[currentStatus]?.includes(status)) {
//         throw new Error(`Invalid status transition from ${currentStatus} to ${status}. Valid transitions are: ${validTransitions[currentStatus].join(', ')}.`);
//       }
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//       setLocationMessage(`Order #${orderId} status updated to ${status}.`);
//     } catch (e) {
//       console.error('updateOrderStatus error:', e);
//       setLocationMessage(`Failed to update order status: ${e.message}`);
//     }
//   }, [orders]);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('EMI application rejected. Notifying buyer to retry with a different payment method.');
//         setRetryOrderId(orderId);
//         setShowRetryPaymentModal(true);
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, [orders]);

//   // Retry payment with a different method
//   const handleRetryPayment = async () => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ payment_method: newPaymentMethod, order_status: 'Order Placed', updated_at: new Date().toISOString() })
//         .eq('id', retryOrderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === retryOrderId
//             ? { ...o, payment_method: newPaymentMethod, order_status: 'Order Placed' }
//             : o
//         )
//       );
//       setShowRetryPaymentModal(false);
//       setRetryOrderId(null);
//       setNewPaymentMethod('credit_card');
//       setLocationMessage('Payment method updated successfully. Order placed.');
//     } catch (e) {
//       console.error('retryPayment error', e);
//       setLocationMessage('Failed to update payment method. Please try again.');
//     }
//   };

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Handle support form submission
//   const handleSupportSubmit = async (e) => {
//     e.preventDefault();
//     if (!supportMessage.trim()) {
//       setLocationMessage('Please enter a support message.');
//       return;
//     }
//     try {
//       const { error } = await supabase.from('support_requests').insert({
//         user_id: session.user.id,
//         message: supportMessage,
//         created_at: new Date().toISOString(),
//       });
//       if (error) throw error;
//       setSupportMessage('');
//       setLocationMessage('Support request submitted successfully.');
//     } catch (e) {
//       console.error('supportSubmit error', e);
//       setLocationMessage('Failed to submit support request. Please try again.');
//     }
//   };

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   useEffect(() => {
//     if (location.state?.newOrderIds) {
//       setLocationMessage('New orders placed successfully! Check below.');
//     }
//   }, [location.state]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                 Edit Profile
//               </button>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {showManualLocation && (
//               <div style={{ marginTop: '15px' }}>
//                 <p>Enter location manually:</p>
//                 <input
//                   type="number"
//                   value={manualLat}
//                   onChange={(e) => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <input
//                   type="number"
//                   value={manualLon}
//                   onChange={(e) => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <button onClick={handleManualLocationUpdate} className="btn-location">
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <>
//               <div className="product-grid">
//                 {products.map((prod) => (
//                   <div key={prod.id} className="product-card">
//                     <div className="product-image-wrapper">
//                       <img
//                         src={prod.images[0] || 'https://dummyimage.com/150'}
//                         alt={prod.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                         style={{ maxWidth: '100%', height: 'auto' }}
//                       />
//                     </div>
//                     <h3 className="product-name">{prod.title}</h3>
//                     <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                     <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                       View
//                     </Link>
//                   </div>
//                 ))}
//               </div>
//               <div style={{ marginTop: '20px', textAlign: 'center' }}>
//                 <button
//                   onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={productsPage === 1}
//                   style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => setProductsPage((prev) => prev + 1)}
//                   disabled={products.length < ITEMS_PER_PAGE}
//                   style={{ padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <>
//             <div className="orders-list">
//               {displayedOrders.map((order) => (
//                 <div key={order.id} className="order-item">
//                   <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                   <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                   <p>Status: {order.order_status}</p>
//                   {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                   {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                     <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                   )}
//                   {order.estimated_delivery && (
//                     <p>
//                       Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: false,
//                       })}
//                     </p>
//                   )}
//                   {order.payment_method === 'emi' ? (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       <div className="order-product">
//                         <div className="order-product-details">
//                           <p>
//                             {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                           </p>
//                           {profile?.is_seller && (
//                             <>
//                               <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                               <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                             </>
//                           )}
//                           {!profile?.is_seller && order.sellers?.store_name && (
//                             <p>Seller: {order.sellers.store_name}</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => {
//                           const variant = item.variant_id && Array.isArray(item.product_variants)
//                             ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                             : null;
//                           const variantAttributes = variant?.attributes
//                             ? Object.entries(variant.attributes)
//                                 .filter(([key, val]) => val)
//                                 .map(([key, val]) => `${key}: ${val}`)
//                                 .join(', ') || 'No variant details available'
//                             : 'No variant selected';
//                           const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                             ? variant.images
//                             : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                             ? item.products.images
//                             : ['https://dummyimage.com/150'];
//                           const displayPrice = variant?.price || item.price;

//                           return (
//                             <div key={idx} className="order-product">
//                               <div className="product-image-wrapper">
//                                 <img
//                                   src={displayImages[0]}
//                                   alt={item.products?.title || 'Product'}
//                                   onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                   style={{ maxWidth: '100%', height: 'auto' }}
//                                 />
//                               </div>
//                               <div className="order-product-details">
//                                 <p>
//                                   {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                                 </p>
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                                 {!profile?.is_seller && order.sellers?.store_name && (
//                                   <p>Seller: {order.sellers.store_name}</p>
//                                 )}
//                               </div>
//                             </div>
//                           );
//                         })
//                       ) : (
//                         <p>No items in this order.</p>
//                       )}
//                     </div>
//                   )}

//                   {String(order.id).startsWith('skeleton-') ? null : (
//                     <>
//                       {profile?.is_seller ? (
//                         <>
//                           {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                             <div className="update-emi-status">
//                               <label>Update EMI Status:</label>
//                               <select
//                                 value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                                 onChange={(e) => {
//                                   const newStatus = e.target.value;
//                                   setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                   updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                                 }}
//                                 aria-label={`Update EMI status for order ${order.id}`}
//                               >
//                                 {emiStatuses.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                           {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                             <div className="update-status">
//                               <label>Update Status:</label>
//                               <select
//                                 value={order.order_status}
//                                 onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                                 aria-label={`Update status for order ${order.id}`}
//                               >
//                                 <option value={order.order_status}>{order.order_status} (Current)</option>
//                                 {validTransitions[order.order_status]?.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                           <button
//                             onClick={() => setCancelOrderId(order.id)}
//                             className="btn-cancel-order"
//                             aria-label={`Cancel order ${order.id}`}
//                           >
//                             Cancel Order
//                           </button>
//                         ) : null
//                       )}
//                       <Link
//                         to={`/order-details/${order.id}`}
//                         className="btn-view-details"
//                         aria-label={`View details for order ${order.id}`}
//                       >
//                         Details
//                       </Link>
//                     </>
//                   )}

//                   {cancelOrderId === order.id && (
//                     <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                       <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                       <select
//                         value={cancelReason}
//                         onChange={(e) => {
//                           setCancelReason(e.target.value);
//                           setIsCustomReason(e.target.value === 'Other (please specify)');
//                         }}
//                         aria-label="Select cancellation reason"
//                       >
//                         <option value="">Select reason</option>
//                         {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                           <option key={r} value={r}>
//                             {r}
//                           </option>
//                         ))}
//                       </select>
//                       {isCustomReason && (
//                         <textarea
//                           value={cancelReason}
//                           onChange={(e) => setCancelReason(e.target.value)}
//                           placeholder="Custom reason"
//                           aria-label="Custom cancellation reason"
//                           className="custom-reason-input"
//                         />
//                       )}
//                       <div className="cancel-modal-buttons">
//                         <button
//                           onClick={() => handleCancelOrder(order.id)}
//                           className="btn-confirm-cancel"
//                           aria-label="Confirm order cancellation"
//                         >
//                           Confirm
//                         </button>
//                         <button
//                           onClick={() => {
//                             setCancelOrderId(null);
//                             setCancelReason('');
//                             setIsCustomReason(false);
//                           }}
//                           className="btn-close-cancel"
//                           aria-label="Close cancellation modal"
//                         >
//                           Close
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div style={{ marginTop: '20px', textAlign: 'center' }}>
//               <button
//                 onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={ordersPage === 1}
//                 style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => setOrdersPage((prev) => prev + 1)}
//                 disabled={orders.length < ITEMS_PER_PAGE}
//                 style={{ padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Next
//               </button>
//             </div>
//           </>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={handleSupportSubmit}>
//             <textarea
//               placeholder="Describe your issue..."
//               className="support-input"
//               style={{ color: '#666' }}
//               value={supportMessage}
//               onChange={(e) => setSupportMessage(e.target.value)}
//             />
//             <button className="support-btn" type="submit">Submit</button>
//           </form>
//         </div>
//       </section>

//       {showRetryPaymentModal && (
//         <div className="cancel-modal" role="dialog" aria-labelledby="retry-payment-modal">
//           <h3 id="retry-payment-modal">Retry Payment for Order #{retryOrderId}</h3>
//           <p>EMI application was rejected. Please select a different payment method to proceed.</p>
//           <select
//             value={newPaymentMethod}
//             onChange={(e) => setNewPaymentMethod(e.target.value)}
//             aria-label="Select new payment method"
//           >
//             {paymentMethods.map((method) => (
//               <option key={method} value={method}>
//                 {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
//               </option>
//             ))}
//           </select>
//           <div className="cancel-modal-buttons">
//             <button onClick={handleRetryPayment} className="btn-confirm-cancel">
//               Confirm Payment
//             </button>
//             <button
//               onClick={() => setShowRetryPaymentModal(false)}
//               className="btn-close-cancel"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(Account);



// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [supportMessage, setSupportMessage] = useState('');
//   const [productsPage, setProductsPage] = useState(1);
//   const [ordersPage, setOrdersPage] = useState(1);
//   const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
//   const [retryOrderId, setRetryOrderId] = useState(null);
//   const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
//   const ITEMS_PER_PAGE = 5;
//   const navigate = useNavigate();
//   const location = useLocation();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];
//   const paymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];

//   // Order status transitions
//   const validTransitions = {
//     'Order Placed': ['Shipped', 'Cancelled'],
//     'Shipped': ['Out for Delivery', 'Cancelled'],
//     'Out for Delivery': ['Delivered', 'Cancelled'],
//     'Delivered': [],
//     'Cancelled': [],
//   };

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel, error: selErr } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [], error: prodErr } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true)
//           .range((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE - 1);
//         if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
//         setProducts(prods);

//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
//           variantData = variants || [];
//         }

//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [], error: buyerOrderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status,
//               seller_name
//             ),
//             profiles!orders_seller_id_fkey (
//               id
//             )
//           `)
//           .eq('user_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

//         const sellerProfileIds = [...new Set(bOrders.map(order => order.profiles?.id).filter(id => id))];
//         let sellersData = [];
//         if (sellerProfileIds.length > 0) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .in('id', sellerProfileIds);
//           if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
//           sellersData = sellers || [];
//         }

//         const updatedOrders = bOrders.map(order => ({
//           ...order,
//           sellers: sellersData.find(seller => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
//         }));
//         setOrders(updatedOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance, productsPage, ordersPage]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Update seller location manually
//   const handleManualLocationUpdate = useCallback(async () => {
//     if (!manualLat || !manualLon) {
//       setLocationMessage('Please enter both latitude and longitude.');
//       return;
//     }
//     const lat = parseFloat(manualLat);
//     const lon = parseFloat(manualLon);
//     if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setLocationMessage('Invalid latitude or longitude values.');
//       return;
//     }
//     try {
//       const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//         seller_uuid: user.id,
//         user_lat: lat,
//         user_lon: lon,
//         store_name_input: seller?.store_name || 'Store',
//       });
//       if (rpcErr) throw rpcErr;
//       const newLoc = { lat, lon };
//       setSellerLocation(newLoc);
//       debouncedFetchAddress(lat, lon);
//       checkSellerDistance(newLoc, buyerLocation);
//       setLocationMessage('Location updated successfully.');
//       setShowManualLocation(false);
//       setManualLat('');
//       setManualLon('');
//     } catch (e) {
//       console.error('manualLocationUpdate error', e);
//       setLocationMessage('Error updating location. Please try again.');
//     }
//   }, [manualLat, manualLon, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
//       setShowManualLocation(true);
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try manually.');
//           setShowManualLocation(true);
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out. Please enter manually.');
//         setShowManualLocation(true);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const currentOrder = orders.find(o => o.id === orderId);
//       const currentStatus = currentOrder.order_status;
//       if (!validTransitions[currentStatus]?.includes(status)) {
//         throw new Error(`Invalid status transition from ${currentStatus} to ${status}. Valid transitions are: ${validTransitions[currentStatus].join(', ')}.`);
//       }
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//       setLocationMessage(`Order #${orderId} status updated to ${status}.`);
//     } catch (e) {
//       console.error('updateOrderStatus error:', e);
//       setLocationMessage(`Failed to update order status: ${e.message}`);
//     }
//   }, [orders]);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('EMI application rejected. Notifying buyer to retry with a different payment method.');
//         setRetryOrderId(orderId);
//         setShowRetryPaymentModal(true);
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, [orders]);

//   // Retry payment with a different method
//   const handleRetryPayment = async () => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ payment_method: newPaymentMethod, order_status: 'Order Placed', updated_at: new Date().toISOString() })
//         .eq('id', retryOrderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === retryOrderId
//             ? { ...o, payment_method: newPaymentMethod, order_status: 'Order Placed' }
//             : o
//         )
//       );
//       setShowRetryPaymentModal(false);
//       setRetryOrderId(null);
//       setNewPaymentMethod('credit_card');
//       setLocationMessage('Payment method updated successfully. Order placed.');
//     } catch (e) {
//       console.error('retryPayment error', e);
//       setLocationMessage('Failed to update payment method. Please try again.');
//     }
//   };

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Handle support form submission
//   const handleSupportSubmit = async (e) => {
//     e.preventDefault();
//     if (!supportMessage.trim()) {
//       setLocationMessage('Please enter a support message.');
//       return;
//     }
//     try {
//       const { error } = await supabase.from('support_requests').insert({
//         user_id: session.user.id,
//         message: supportMessage,
//         created_at: new Date().toISOString(),
//       });
//       if (error) throw error;
//       setSupportMessage('');
//       setLocationMessage('Support request submitted successfully.');
//     } catch (e) {
//       console.error('supportSubmit error', e);
//       setLocationMessage('Failed to submit support request. Please try again.');
//     }
//   };

//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setSellerLocation(null); // Reset location context
//       setLocationMessage('Logged out successfully.');
//       navigate('/', { replace: true }); // Redirect to homepage
//     } catch (e) {
//       console.error('logout error', e);
//       setLocationMessage('Error logging out. Please try again.');
//     }
//   };

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   useEffect(() => {
//     if (location.state?.newOrderIds) {
//       setLocationMessage('New orders placed successfully! Check below.');
//     }
//   }, [location.state]);

//   if (error) {
//     return (
//       <div className="account-error">
//         {error}
//         <button onClick={fetchUserData} className="retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="account-container">
//       <header className="account-header">
//         <h1 className="account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="account-section">
//         <h2 className="section-heading">
//           <FaUser className="user-icon" /> My Profile
//         </h2>
//         <div className="profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <div className="profile-actions">
//                 <button onClick={() => setEditProfile(true)} className="btn-edit-profile" aria-label="Edit profile">
//                   Edit Profile
//                 </button>
//                 <button onClick={handleLogout} className="btn-logout" aria-label="Log out">
//                   Logout
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'distance-status warning' : 'distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {showManualLocation && (
//               <div style={{ marginTop: '15px' }}>
//                 <p>Enter location manually:</p>
//                 <input
//                   type="number"
//                   value={manualLat}
//                   onChange={(e) => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <input
//                   type="number"
//                   value={manualLon}
//                   onChange={(e) => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
//                 />
//                 <button onClick={handleManualLocationUpdate} className="btn-location">
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             <Link to="/seller" className="btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="account-section">
//           <h2 className="section-heading">My Products</h2>
//           {loading ? (
//             <div className="product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="product-card-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                   <div className="skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <>
//               <div className="product-grid">
//                 {products.map((prod) => (
//                   <div key={prod.id} className="product-card">
//                     <div className="product-image-wrapper">
//                       <img
//                         src={prod.images[0] || 'https://dummyimage.com/150'}
//                         alt={prod.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                         style={{ maxWidth: '100%', height: 'auto' }}
//                       />
//                     </div>
//                     <h3 className="product-name">{prod.title}</h3>
//                     <p className="product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                     <Link to={`/product/${prod.id}`} className="btn-view-product" aria-label={`View ${prod.title}`}>
//                       View
//                     </Link>
//                   </div>
//                 ))}
//               </div>
//               <div style={{ marginTop: '20px', textAlign: 'center' }}>
//                 <button
//                   onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={productsPage === 1}
//                   style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => setProductsPage((prev) => prev + 1)}
//                   disabled={products.length < ITEMS_PER_PAGE}
//                   style={{ padding: '8px 16px', borderRadius: '4px' }}
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           ) : (
//             <p>No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="account-section">
//         <h2 className="section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="order-item-skeleton">
//                 <div className="skeleton-text" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-text short" />
//                 <div className="skeleton-product">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                 </div>
//                 <div className="skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <>
//             <div className="orders-list">
//               {displayedOrders.map((order) => (
//                 <div key={order.id} className="order-item">
//                   <h3>Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                   <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                   <p>Status: {order.order_status}</p>
//                   {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                   {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                     <p style={{ color: '#ff9800' }}>(Waiting for Approval)</p>
//                   )}
//                   {order.estimated_delivery && (
//                     <p>
//                       Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: false,
//                       })}
//                     </p>
//                   )}
//                   {order.payment_method === 'emi' ? (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       <div className="order-product">
//                         <div className="order-product-details">
//                           <p>
//                             {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                           </p>
//                           {profile?.is_seller && (
//                             <>
//                               <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                               <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                             </>
//                           )}
//                           {!profile?.is_seller && order.sellers?.store_name && (
//                             <p>Seller: {order.sellers.store_name}</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="order-products">
//                       <h4>Items:</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => {
//                           const variant = item.variant_id && Array.isArray(item.product_variants)
//                             ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                             : null;
//                           const variantAttributes = variant?.attributes
//                             ? Object.entries(variant.attributes)
//                                 .filter(([key, val]) => val)
//                                 .map(([key, val]) => `${key}: ${val}`)
//                                 .join(', ') || 'No variant details available'
//                             : 'No variant selected';
//                           const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                             ? variant.images
//                             : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                             ? item.products.images
//                             : ['https://dummyimage.com/150'];
//                           const displayPrice = variant?.price || item.price;

//                           return (
//                             <div key={idx} className="order-product">
//                               <div className="product-image-wrapper">
//                                 <img
//                                   src={displayImages[0]}
//                                   alt={item.products?.title || 'Product'}
//                                   onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                   style={{ maxWidth: '100%', height: 'auto' }}
//                                 />
//                               </div>
//                               <div className="order-product-details">
//                                 <p>
//                                   {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                                 </p>
//                                 <p className="variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                                 {!profile?.is_seller && order.sellers?.store_name && (
//                                   <p>Seller: {order.sellers.store_name}</p>
//                                 )}
//                               </div>
//                             </div>
//                           );
//                         })
//                       ) : (
//                         <p>No items in this order.</p>
//                       )}
//                     </div>
//                   )}

//                   {String(order.id).startsWith('skeleton-') ? null : (
//                     <>
//                       {profile?.is_seller ? (
//                         <>
//                           {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                             <div className="update-emi-status">
//                               <label>Update EMI Status:</label>
//                               <select
//                                 value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                                 onChange={(e) => {
//                                   const newStatus = e.target.value;
//                                   setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                   updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                                 }}
//                                 aria-label={`Update EMI status for order ${order.id}`}
//                               >
//                                 {emiStatuses.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                           {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                             <div className="update-status">
//                               <label>Update Status:</label>
//                               <select
//                                 value={order.order_status}
//                                 onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                                 aria-label={`Update status for order ${order.id}`}
//                               >
//                                 <option value={order.order_status}>{order.order_status} (Current)</option>
//                                 {validTransitions[order.order_status]?.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                           <button
//                             onClick={() => setCancelOrderId(order.id)}
//                             className="btn-cancel-order"
//                             aria-label={`Cancel order ${order.id}`}
//                           >
//                             Cancel Order
//                           </button>
//                         ) : null
//                       )}
//                       <Link
//                         to={`/order-details/${order.id}`}
//                         className="btn-view-details"
//                         aria-label={`View details for order ${order.id}`}
//                       >
//                         Details
//                       </Link>
//                     </>
//                   )}

//                   {cancelOrderId === order.id && (
//                     <div className="cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                       <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                       <select
//                         value={cancelReason}
//                         onChange={(e) => {
//                           setCancelReason(e.target.value);
//                           setIsCustomReason(e.target.value === 'Other (please specify)');
//                         }}
//                         aria-label="Select cancellation reason"
//                       >
//                         <option value="">Select reason</option>
//                         {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                           <option key={r} value={r}>
//                             {r}
//                           </option>
//                         ))}
//                       </select>
//                       {isCustomReason && (
//                         <textarea
//                           value={cancelReason}
//                           onChange={(e) => setCancelReason(e.target.value)}
//                           placeholder="Custom reason"
//                           aria-label="Custom cancellation reason"
//                           className="custom-reason-input"
//                         />
//                       )}
//                       <div className="cancel-modal-buttons">
//                         <button
//                           onClick={() => handleCancelOrder(order.id)}
//                           className="btn-confirm-cancel"
//                           aria-label="Confirm order cancellation"
//                         >
//                           Confirm
//                         </button>
//                         <button
//                           onClick={() => {
//                             setCancelOrderId(null);
//                             setCancelReason('');
//                             setIsCustomReason(false);
//                           }}
//                           className="btn-close-cancel"
//                           aria-label="Close cancellation modal"
//                         >
//                           Close
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div style={{ marginTop: '20px', textAlign: 'center' }}>
//               <button
//                 onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={ordersPage === 1}
//                 style={{ marginRight: '10px', padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => setOrdersPage((prev) => prev + 1)}
//                 disabled={orders.length < ITEMS_PER_PAGE}
//                 style={{ padding: '8px 16px', borderRadius: '4px' }}
//               >
//                 Next
//               </button>
//             </div>
//           </>
//         ) : (
//           <p>{profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}</p>
//         )}
//       </section>

//       <section className="account-section">
//         <h2 className="section-heading">Support</h2>
//         <div className="support">
//           <h1 style={{ color: '#007bff' }}>Support</h1>
//           <p style={{ color: '#666' }}>
//             Contact us at <a href="mailto:support@justorder.com">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" style={{ color: '#007bff' }}>
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" style={{ color: '#007bff' }}>
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={handleSupportSubmit}>
//             <textarea
//               placeholder="Describe your issue..."
//               className="support-input"
//               style={{ color: '#666' }}
//               value={supportMessage}
//               onChange={(e) => setSupportMessage(e.target.value)}
//             />
//             <button className="support-btn" type="submit">Submit</button>
//           </form>
//         </div>
//       </section>

//       {showRetryPaymentModal && (
//         <div className="cancel-modal" role="dialog" aria-labelledby="retry-payment-modal">
//           <h3 id="retry-payment-modal">Retry Payment for Order #{retryOrderId}</h3>
//           <p>EMI application was rejected. Please select a different payment method to proceed.</p>
//           <select
//             value={newPaymentMethod}
//             onChange={(e) => setNewPaymentMethod(e.target.value)}
//             aria-label="Select new payment method"
//           >
//             {paymentMethods.map((method) => (
//               <option key={method} value={method}>
//                 {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
//               </option>
//             ))}
//           </select>
//           <div className="cancel-modal-buttons">
//             <button onClick={handleRetryPayment} className="btn-confirm-cancel">
//               Confirm Payment
//             </button>
//             <button
//               onClick={() => setShowRetryPaymentModal(false)}
//               className="btn-close-cancel"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(Account);




// import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaUser } from 'react-icons/fa';
// import '../style/Account.css';

// // Utility to debounce a functiona
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Calculate great-circle distance between two coords
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((sellerLoc.lat * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Account() {
//   const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState('Not set');
//   const [distanceStatus, setDistanceStatus] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cancelOrderId, setCancelOrderId] = useState(null);
//   const [cancelReason, setCancelReason] = useState('');
//   const [isCustomReason, setIsCustomReason] = useState(false);
//   const [editProfile, setEditProfile] = useState(false);
//   const [fullName, setFullName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [supportMessage, setSupportMessage] = useState('');
//   const [productsPage, setProductsPage] = useState(1);
//   const [ordersPage, setOrdersPage] = useState(1);
//   const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
//   const [retryOrderId, setRetryOrderId] = useState(null);
//   const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
//   const ITEMS_PER_PAGE = 5;
//   const navigate = useNavigate();
//   const location = useLocation();

//   const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
//   const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
//   const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
//   const emiStatuses = ['pending', 'approved', 'rejected'];
//   const paymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];

//   // Order status transitions
//   const validTransitions = {
//     'Order Placed': ['Shipped', 'Cancelled'],
//     'Shipped': ['Out for Delivery', 'Cancelled'],
//     'Out for Delivery': ['Delivered', 'Cancelled'],
//     'Delivered': [],
//     'Cancelled': [],
//   };

//   // Debounced address fetch
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         setAddress(data.display_name || 'Address not found');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress('Error fetching address');
//       }
//     }, 500),
//     []
//   );

//   // Determine distance status
//   const checkSellerDistance = useCallback((sellerLoc, userLoc) => {
//     if (!sellerLoc || !userLoc) {
//       setDistanceStatus('Unable to calculate distance due to missing location data.');
//       return;
//     }
//     const dist = calculateDistance(userLoc, sellerLoc);
//     if (dist === null) {
//       setDistanceStatus('Unable to calculate distance.');
//     } else if (dist <= 40) {
//       setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
//     } else {
//       setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
//     }
//   }, []);

//   // Load user data
//   const fetchUserData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (!session?.user?.id) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setUser(session.user);

//       const { data: prof, error: profErr } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
//       if (!prof) {
//         navigate('/auth', { replace: true });
//         return;
//       }
//       setProfile(prof);
//       setFullName(prof.full_name || '');
//       setPhoneNumber(prof.phone_number || '');

//       if (prof.is_seller) {
//         const { data: sel, error: selErr } = await supabase
//           .from('sellers')
//           .select('*')
//           .eq('id', session.user.id)
//           .maybeSingle();
//         if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
//         setSeller(sel || null);

//         if (sel?.latitude && sel?.longitude) {
//           const newLoc = { lat: sel.latitude, lon: sel.longitude };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(sel.latitude, sel.longitude);
//           checkSellerDistance(newLoc, buyerLocation);
//         }

//         const { data: prods = [], error: prodErr } = await supabase
//           .from('products')
//           .select('id, title, price, images')
//           .eq('seller_id', session.user.id)
//           .eq('is_approved', true)
//           .range((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE - 1);
//         if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
//         setProducts(prods);

//         const { data: sOrders = [], error: orderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               variant_id,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status
//             ),
//             profiles!orders_user_id_fkey (
//               email
//             )
//           `)
//           .eq('seller_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

//         const variantIds = sOrders
//           .flatMap(order => order.order_items || [])
//           .filter(item => item.variant_id)
//           .map(item => item.variant_id);
//         let variantData = [];
//         if (variantIds.length > 0) {
//           const { data: variants, error: variantError } = await supabase
//             .from('product_variants')
//             .select('id, attributes, images, price')
//             .in('id', [...new Set(variantIds)]);
//           if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
//           variantData = variants || [];
//         }

//         const updatedOrders = sOrders.map(order => ({
//           ...order,
//           order_items: order.order_items?.map(item => ({
//             ...item,
//             product_variants: item.variant_id ? variantData.filter(v => v.id === item.variant_id) : [],
//           })) || [],
//         }));
//         setOrders(updatedOrders);
//       } else {
//         const { data: bOrders = [], error: buyerOrderError } = await supabase
//           .from('orders')
//           .select(`
//             *,
//             estimated_delivery,
//             order_items (
//               product_id,
//               quantity,
//               price,
//               products (id, title, images)
//             ),
//             emi_applications!orders_emi_application_uuid_fkey (
//               product_name,
//               product_price,
//               full_name,
//               mobile_number,
//               status,
//               seller_name
//             ),
//             profiles!orders_seller_id_fkey (
//               id
//             )
//           `)
//           .eq('user_id', session.user.id)
//           .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
//         if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

//         const sellerProfileIds = [...new Set(bOrders.map(order => order.profiles?.id).filter(id => id))];
//         let sellersData = [];
//         if (sellerProfileIds.length > 0) {
//           const { data: sellers, error: sellersError } = await supabase
//             .from('sellers')
//             .select('id, store_name')
//             .in('id', sellerProfileIds);
//           if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
//           sellersData = sellers || [];
//         }

//         const updatedOrders = bOrders.map(order => ({
//           ...order,
//           sellers: sellersData.find(seller => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
//         }));
//         setOrders(updatedOrders);
//       }
//     } catch (e) {
//       console.error('fetchUserData error', e);
//       setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
//     } finally {
//       setLoading(false);
//     }
//   }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance, productsPage, ordersPage]);

//   // Save profile updates
//   const saveProfile = useCallback(async () => {
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName, phone_number: phoneNumber })
//         .eq('id', session.user.id);
//       if (error) throw error;
//       setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
//       setEditProfile(false);
//       setLocationMessage('Profile updated successfully.');
//     } catch (e) {
//       console.error('saveProfile error', e);
//       setLocationMessage('Error updating profile. Please try again.');
//     }
//   }, [fullName, phoneNumber, session]);

//   // Update seller location manually
//   const handleManualLocationUpdate = useCallback(async () => {
//     if (!manualLat || !manualLon) {
//       setLocationMessage('Please enter both latitude and longitude.');
//       return;
//     }
//     const lat = parseFloat(manualLat);
//     const lon = parseFloat(manualLon);
//     if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setLocationMessage('Invalid latitude or longitude values.');
//       return;
//     }
//     try {
//       const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//         seller_uuid: user.id,
//         user_lat: lat,
//         user_lon: lon,
//         store_name_input: seller?.store_name || 'Store',
//       });
//       if (rpcErr) throw rpcErr;
//       const newLoc = { lat, lon };
//       setSellerLocation(newLoc);
//       debouncedFetchAddress(lat, lon);
//       checkSellerDistance(newLoc, buyerLocation);
//       setLocationMessage('Location updated successfully.');
//       setShowManualLocation(false);
//       setManualLat('');
//       setManualLon('');
//     } catch (e) {
//       console.error('manualLocationUpdate error', e);
//       setLocationMessage('Error updating location. Please try again.');
//     }
//   }, [manualLat, manualLon, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Detect & set seller location via RPC
//   const handleDetectLocation = useCallback(() => {
//     if (!profile?.is_seller) {
//       setLocationMessage('Only sellers can update location.');
//       return;
//     }
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
//       setShowManualLocation(true);
//       return;
//     }
//     setLocationMessage('Detecting...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         try {
//           const { error: rpcErr } = await supabase.rpc('set_seller_location', {
//             seller_uuid: user.id,
//             user_lat: lat,
//             user_lon: lon,
//             store_name_input: seller?.store_name || 'Store',
//           });
//           if (rpcErr) throw rpcErr;
//           const newLoc = { lat, lon };
//           setSellerLocation(newLoc);
//           debouncedFetchAddress(lat, lon);
//           checkSellerDistance(newLoc, buyerLocation);
//           setLocationMessage('Location updated successfully.');
//         } catch (e) {
//           console.error('detectLocation RPC error', e);
//           setLocationMessage('Error updating location. Please try manually.');
//           setShowManualLocation(true);
//         }
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out. Please enter manually.');
//         setShowManualLocation(true);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

//   // Update order status
//   const updateOrderStatus = useCallback(async (orderId, status) => {
//     try {
//       const currentOrder = orders.find(o => o.id === orderId);
//       const currentStatus = currentOrder.order_status;
//       if (!validTransitions[currentStatus]?.includes(status)) {
//         throw new Error(`Invalid status transition from ${currentStatus} to ${status}. Valid transitions are: ${validTransitions[currentStatus].join(', ')}.`);
//       }
//       const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
//       setLocationMessage(`Order #${orderId} status updated to ${status}.`);
//     } catch (e) {
//       console.error('updateOrderStatus error:', e);
//       setLocationMessage(`Failed to update order status: ${e.message}`);
//     }
//   }, [orders]);

//   // Update EMI status
//   const updateEmiStatus = useCallback(async (orderId, emiApplicationId, newStatus) => {
//     try {
//       const { error: emiError } = await supabase
//         .from('emi_applications')
//         .update({ status: newStatus })
//         .eq('id', emiApplicationId);
//       if (emiError) throw emiError;

//       let orderStatusUpdate = 'pending';
//       if (newStatus === 'approved') {
//         orderStatusUpdate = 'Order Placed';
//         setLocationMessage('EMI application approved successfully! The buyer will be happy.');
//       } else if (newStatus === 'rejected') {
//         orderStatusUpdate = 'Cancelled';
//         setLocationMessage('EMI application rejected. Notifying buyer to retry with a different payment method.');
//         setRetryOrderId(orderId);
//         setShowRetryPaymentModal(true);
//       }

//       const { error: orderError } = await supabase
//         .from('orders')
//         .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
//         .eq('id', orderId);
//       if (orderError) throw orderError;

//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId
//             ? {
//                 ...o,
//                 order_status: orderStatusUpdate,
//                 emi_applications: { ...o.emi_applications, status: newStatus },
//               }
//             : o
//         )
//       );
//       setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
//     } catch (e) {
//       console.error('updateEmiStatus error', e);
//       setLocationMessage('Failed to update EMI status. Please try again.');
//     }
//   }, [orders]);

//   // Retry payment with a different method
//   const handleRetryPayment = async () => {
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ payment_method: newPaymentMethod, order_status: 'Order Placed', updated_at: new Date().toISOString() })
//         .eq('id', retryOrderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === retryOrderId
//             ? { ...o, payment_method: newPaymentMethod, order_status: 'Order Placed' }
//             : o
//         )
//       );
//       setShowRetryPaymentModal(false);
//       setRetryOrderId(null);
//       setNewPaymentMethod('credit_card');
//       setLocationMessage('Payment method updated successfully. Order placed.');
//     } catch (e) {
//       console.error('retryPayment error', e);
//       setLocationMessage('Failed to update payment method. Please try again.');
//     }
//   };

//   // Cancel order
//   const handleCancelOrder = useCallback(async (orderId) => {
//     if (!cancelReason) {
//       setLocationMessage('Please select a cancellation reason.');
//       return;
//     }
//     try {
//       const { error } = await supabase
//         .from('orders')
//         .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
//         .eq('id', orderId);
//       if (error) throw error;
//       setOrders((prev) =>
//         prev.map((o) =>
//           o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
//         )
//       );
//       setCancelOrderId(null);
//       setCancelReason('');
//       setIsCustomReason(false);
//       setLocationMessage('Order cancelled successfully.');
//     } catch (e) {
//       console.error('cancelOrder error', e);
//       setLocationMessage('Error cancelling order. Please try again.');
//     }
//   }, [cancelReason]);

//   // Handle support form submission
//   const handleSupportSubmit = async (e) => {
//     e.preventDefault();
//     if (!supportMessage.trim()) {
//       setLocationMessage('Please enter a support message.');
//       return;
//     }
//     try {
//       const { error } = await supabase.from('support_requests').insert({
//         user_id: session.user.id,
//         message: supportMessage,
//         created_at: new Date().toISOString(),
//       });
//       if (error) throw error;
//       setSupportMessage('');
//       setLocationMessage('Support request submitted successfully.');
//     } catch (e) {
//       console.error('supportSubmit error', e);
//       setLocationMessage('Failed to submit support request. Please try again.');
//     }
//   };

//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setSellerLocation(null); // Reset location context
//       setLocationMessage('Logged out successfully.');
//       navigate('/', { replace: true }); // Redirect to homepage
//     } catch (e) {
//       console.error('logout error', e);
//       setLocationMessage('Error logging out. Please try again.');
//     }
//   };

//   // Memoized orders with skeleton data while loading
//   const displayedOrders = useMemo(() => {
//     if (loading) {
//       return [...Array(3)].map((_, i) => ({
//         id: `skeleton-${i}`,
//         total: 0,
//         order_status: 'Loading',
//         order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
//       }));
//     }
//     return orders;
//   }, [loading, orders]);

//   useEffect(() => {
//     fetchUserData();
//   }, [fetchUserData]);

//   useEffect(() => {
//     if (location.state?.newOrderIds) {
//       setLocationMessage('New orders placed successfully! Check below.');
//     }
//   }, [location.state]);

//   if (error) {
//     return (
//       <div className="td-account-error">
//         {error}
//         <button onClick={fetchUserData} className="td-retry-btn">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="td-account-container">
//       <header className="td-account-header">
//         <h1 className="td-account-title">FreshCart Account Dashboard</h1>
//       </header>

//       <section className="td-account-section">
//         <h2 className="td-section-heading">
//           <FaUser className="td-user-icon" /> My Profile
//         </h2>
//         <div className="td-profile-info">
//           {editProfile ? (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name:{' '}
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter full name"
//                   className="td-profile-input"
//                 />
//               </p>
//               <p>
//                 Phone:{' '}
//                 <input
//                   type="tel"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   placeholder="Enter phone number"
//                   className="td-profile-input"
//                 />
//               </p>
//               <button onClick={saveProfile} className="td-btn-save-profile">
//                 Save
//               </button>
//               <button onClick={() => setEditProfile(false)} className="td-btn-cancel-edit">
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <>
//               <p>
//                 Email: <span>{user?.email || 'Not set'}</span>
//               </p>
//               <p>
//                 Full Name: <span>{profile?.full_name || 'Not set'}</span>
//               </p>
//               <p>
//                 Phone: <span>{profile?.phone_number || 'Not set'}</span>
//               </p>
//               <div className="td-profile-actions">
//                 <button onClick={() => setEditProfile(true)} className="td-btn-edit-profile" aria-label="Edit profile">
//                   Edit Profile
//                 </button>
//                 <button onClick={handleLogout} className="td-btn-logout" aria-label="Log out">
//                   Logout
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         {profile?.is_seller && (
//           <div className="td-seller-location">
//             <p>
//               Store Location: <span>{address}</span>
//             </p>
//             <p className={distanceStatus.includes('Warning') ? 'td-distance-status warning' : 'td-distance-status'}>
//               {distanceStatus}
//             </p>
//             <button onClick={handleDetectLocation} className="td-btn-location" aria-label="Detect or update location">
//               Detect/Update Location
//             </button>
//             {showManualLocation && (
//               <div className="td-manual-location">
//                 <p>Enter location manually:</p>
//                 <input
//                   type="number"
//                   value={manualLat}
//                   onChange={(e) => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   className="td-manual-input"
//                 />
//                 <input
//                   type="number"
//                   value={manualLon}
//                   onChange={(e) => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   className="td-manual-input"
//                 />
//                 <button onClick={handleManualLocationUpdate} className="td-btn-location">
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             {locationMessage && <p className="td-location-message">{locationMessage}</p>}
//             <Link to="/seller" className="td-btn-seller-dashboard" aria-label="Go to seller dashboard">
//               Go to Seller Dashboard
//             </Link>
//           </div>
//         )}
//       </section>

//       {profile?.is_seller && (
//         <section className="td-account-section">
//           <h2 className="td-section-heading">My Products</h2>
//           {loading ? (
//             <div className="td-product-grid">
//               {[...Array(3)].map((_, i) => (
//                 <div key={`skeleton-${i}`} className="td-product-card-skeleton">
//                   <div className="td-skeleton-image" />
//                   <div className="td-skeleton-text" />
//                   <div className="td-skeleton-text short" />
//                   <div className="td-skeleton-btn" />
//                 </div>
//               ))}
//             </div>
//           ) : products.length ? (
//             <>
//               <div className="td-product-grid">
//                 {products.map((prod) => (
//                   <div key={prod.id} className="td-product-card">
//                     <div className="td-product-image-wrapper">
//                       <img
//                         src={prod.images[0] || 'https://dummyimage.com/150'}
//                         alt={prod.title}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                         className="td-product-image"
//                       />
//                     </div>
//                     <h3 className="td-product-name">{prod.title}</h3>
//                     <p className="td-product-price">₹{prod.price.toLocaleString('en-IN')}</p>
//                     <Link to={`/product/${prod.id}`} className="td-btn-view-product" aria-label={`View ${prod.title}`}>
//                       View
//                     </Link>
//                   </div>
//                 ))}
//               </div>
//               <div className="td-pagination">
//                 <button
//                   onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={productsPage === 1}
//                   className="td-btn-pagination"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => setProductsPage((prev) => prev + 1)}
//                   disabled={products.length < ITEMS_PER_PAGE}
//                   className="td-btn-pagination"
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           ) : (
//             <p className="td-no-products">No products added yet.</p>
//           )}
//         </section>
//       )}

//       <section className="td-account-section">
//         <h2 className="td-section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
//         {loading ? (
//           <div className="td-orders-list">
//             {[...Array(3)].map((_, i) => (
//               <div key={`skeleton-${i}`} className="td-order-item-skeleton">
//                 <div className="td-skeleton-text" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-text short" />
//                 <div className="td-skeleton-product">
//                   <div className="td-skeleton-image" />
//                   <div className="td-skeleton-text" />
//                 </div>
//                 <div className="td-skeleton-btn" />
//               </div>
//             ))}
//           </div>
//         ) : orders.length ? (
//           <>
//             <div className="td-orders-list">
//               {displayedOrders.map((order) => (
//                 <div key={order.id} className="td-order-item">
//                   <h3 className="td-order-item-title">Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-','') : order.id}</h3>
//                   <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                   <p>Status: {order.order_status}</p>
//                   {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
//                   {order.payment_method === 'emi' && order.order_status === 'pending' && (
//                     <p className="td-emi-pending">(Waiting for Approval)</p>
//                   )}
//                   {order.estimated_delivery && (
//                     <p>
//                       Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
//                         year: 'numeric',
//                         month: '2-digit',
//                         day: '2-digit',
//                         hour: '2-digit',
//                         minute: '2-digit',
//                         hour12: false,
//                       })}
//                     </p>
//                   )}
//                   {order.payment_method === 'emi' ? (
//                     <div className="td-order-products">
//                       <h4 className="td-order-products-title">Items:</h4>
//                       <div className="td-order-product">
//                         <div className="td-order-product-details">
//                           <p>
//                             {order.emi_applications?.product_name || 'N/A'} - ₹{(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
//                           </p>
//                           {profile?.is_seller && (
//                             <>
//                               <p>Buyer: {order.emi_applications?.full_name || 'Unknown'} ({order.profiles?.email || 'N/A'})</p>
//                               <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
//                             </>
//                           )}
//                           {!profile?.is_seller && order.sellers?.store_name && (
//                             <p>Seller: {order.sellers.store_name}</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="td-order-products">
//                       <h4 className="td-order-products-title">Items:</h4>
//                       {order.order_items?.length > 0 ? (
//                         order.order_items.map((item, idx) => {
//                           const variant = item.variant_id && Array.isArray(item.product_variants)
//                             ? (item.product_variants.find(v => v.id === item.variant_id) || null)
//                             : null;
//                           const variantAttributes = variant?.attributes
//                             ? Object.entries(variant.attributes)
//                                 .filter(([key, val]) => val)
//                                 .map(([key, val]) => `${key}: ${val}`)
//                                 .join(', ') || 'No variant details available'
//                             : 'No variant selected';
//                           const displayImages = variant?.images && Array.isArray(variant.images) && variant.images.length > 0
//                             ? variant.images
//                             : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
//                             ? item.products.images
//                             : ['https://dummyimage.com/150'];
//                           const displayPrice = variant?.price || item.price;

//                           return (
//                             <div key={idx} className="td-order-product">
//                               <div className="td-product-image-wrapper">
//                                 <img
//                                   src={displayImages[0]}
//                                   alt={item.products?.title || 'Product'}
//                                   onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//                                   className="td-product-image"
//                                 />
//                               </div>
//                               <div className="td-order-product-details">
//                                 <p className="td-order-product-title">
//                                   {item.products?.title || 'Product'} x{item.quantity} @ ₹{displayPrice.toLocaleString('en-IN')}
//                                 </p>
//                                 <p className="td-variant-details">
//                                   Variant: {variantAttributes}
//                                 </p>
//                                 {!profile?.is_seller && order.sellers?.store_name && (
//                                   <p>Seller: {order.sellers.store_name}</p>
//                                 )}
//                               </div>
//                             </div>
//                           );
//                         })
//                       ) : (
//                         <p>No items in this order.</p>
//                       )}
//                     </div>
//                   )}

//                   {String(order.id).startsWith('skeleton-') ? null : (
//                     <>
//                       {profile?.is_seller ? (
//                         <>
//                           {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
//                             <div className="td-update-emi-status">
//                               <label>Update EMI Status:</label>
//                               <select
//                                 value={emiStatusUpdates[order.id] || order.emi_applications.status}
//                                 onChange={(e) => {
//                                   const newStatus = e.target.value;
//                                   setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
//                                   updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
//                                 }}
//                                 className="td-select"
//                                 aria-label={`Update EMI status for order ${order.id}`}
//                               >
//                                 {emiStatuses.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s.charAt(0).toUpperCase() + s.slice(1)}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                           {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
//                             <div className="td-update-status">
//                               <label>Update Status:</label>
//                               <select
//                                 value={order.order_status}
//                                 onChange={(e) => updateOrderStatus(order.id, e.target.value)}
//                                 className="td-select"
//                                 aria-label={`Update status for order ${order.id}`}
//                               >
//                                 <option value={order.order_status}>{order.order_status} (Current)</option>
//                                 {validTransitions[order.order_status]?.map((s) => (
//                                   <option key={s} value={s}>
//                                     {s}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
//                           <button
//                             onClick={() => setCancelOrderId(order.id)}
//                             className="td-btn-cancel-order"
//                             aria-label={`Cancel order ${order.id}`}
//                           >
//                             Cancel Order
//                           </button>
//                         ) : null
//                       )}
//                       <Link
//                         to={`/order-details/${order.id}`}
//                         className="td-btn-view-details"
//                         aria-label={`View details for order ${order.id}`}
//                       >
//                         Details
//                       </Link>
//                     </>
//                   )}

//                   {cancelOrderId === order.id && (
//                     <div className="td-cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
//                       <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
//                       <select
//                         value={cancelReason}
//                         onChange={(e) => {
//                           setCancelReason(e.target.value);
//                           setIsCustomReason(e.target.value === 'Other (please specify)');
//                         }}
//                         aria-label="Select cancellation reason"
//                       >
//                         <option value="">Select reason</option>
//                         {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
//                           <option key={r} value={r}>
//                             {r}
//                           </option>
//                         ))}
//                       </select>
//                       {isCustomReason && (
//                         <textarea
//                           value={cancelReason}
//                           onChange={(e) => setCancelReason(e.target.value)}
//                           placeholder="Custom reason"
//                           aria-label="Custom cancellation reason"
//                           className="td-custom-reason-input"
//                         />
//                       )}
//                       <div className="td-cancel-modal-buttons">
//                         <button
//                           onClick={() => handleCancelOrder(order.id)}
//                           className="td-btn-confirm-cancel"
//                           aria-label="Confirm order cancellation"
//                         >
//                           Confirm
//                         </button>
//                         <button
//                           onClick={() => {
//                             setCancelOrderId(null);
//                             setCancelReason('');
//                             setIsCustomReason(false);
//                           }}
//                           className="td-btn-close-cancel"
//                           aria-label="Close cancellation modal"
//                         >
//                           Close
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="td-pagination">
//               <button
//                 onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={ordersPage === 1}
//                 className="td-btn-pagination"
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => setOrdersPage((prev) => prev + 1)}
//                 disabled={orders.length < ITEMS_PER_PAGE}
//                 className="td-btn-pagination"
//               >
//                 Next
//               </button>
//             </div>
//           </>
//         ) : (
//           <p className={profile?.is_seller ? 'td-no-orders' : 'td-no-orders'}>
//             {profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}
//           </p>
//         )}
//       </section>

//       <section className="td-account-section">
//         <h2 className="td-section-heading">Support</h2>
//         <div className="td-support">
//           <h1 className="td-support-title">Support</h1>
//           <p className="td-support-text">
//             Contact us at <a href="mailto:support@justorder.com" className="td-policy-link">support@justorder.com</a> or call 8825287284 (Sunil Rawani) for assistance.{' '}
//             <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" className="td-whatsapp-link">
//               WhatsApp us
//             </a>
//             <br />
//             Learn more about our{' '}
//             <Link to="/policy" className="td-policy-link">
//               Policies
//             </Link>{' '}
//             and{' '}
//             <Link to="/privacy" className="td-policy-link">
//               Privacy Policy
//             </Link>.
//           </p>
//           <form onSubmit={handleSupportSubmit}>
//             <textarea
//               placeholder="Describe your issue..."
//               className="td-support-input"
//               value={supportMessage}
//               onChange={(e) => setSupportMessage(e.target.value)}
//             />
//             <button className="td-support-btn" type="submit">Submit</button>
//           </form>
//         </div>
//       </section>

//       {showRetryPaymentModal && (
//         <div className="td-cancel-modal" role="dialog" aria-labelledby="retry-payment-modal">
//           <h3 id="retry-payment-modal">Retry Payment for Order #{retryOrderId}</h3>
//           <p>EMI application was rejected. Please select a different payment method to proceed.</p>
//           <select
//             value={newPaymentMethod}
//             onChange={(e) => setNewPaymentMethod(e.target.value)}
//             aria-label="Select new payment method"
//           >
//             {paymentMethods.map((method) => (
//               <option key={method} value={method}>
//                 {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
//               </option>
//             ))}
//           </select>
//           <div className="td-cancel-modal-buttons">
//             <button onClick={handleRetryPayment} className="td-btn-confirm-cancel">
//               Confirm Payment
//             </button>
//             <button
//               onClick={() => setShowRetryPaymentModal(false)}
//               className="td-btn-close-cancel"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(Account);



import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { Helmet } from 'react-helmet-async';
import { FaUser } from 'react-icons/fa';
import '../style/Account.css';

// Utility to debounce a function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Calculate great-circle distance between two coords
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
  const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLoc.lat * Math.PI) / 180) *
    Math.cos((sellerLoc.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Account() {
  const { buyerLocation, setSellerLocation, session } = useContext(LocationContext);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState('Not set');
  const [distanceStatus, setDistanceStatus] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emiStatusUpdates, setEmiStatusUpdates] = useState({});
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
  const [retryOrderId, setRetryOrderId] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState('credit_card');
  const ITEMS_PER_PAGE = 5;
  const navigate = useNavigate();
  const location = useLocation();

  const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
  const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
  const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const emiStatuses = ['pending', 'approved', 'rejected'];
  const paymentMethods = ['credit_card', 'debit_card', 'upi', 'cash_on_delivery'];

  // Order status transitions
  const validTransitions = {
    'Order Placed': ['Shipped', 'Cancelled'],
    'Shipped': ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': [],
  };

  // SEO variables
  const pageUrl = 'https://www.freshcart.com/account';
  const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
  const pageTitle = profile?.is_seller ? 'Seller Dashboard - FreshCart' : 'Account Dashboard - FreshCart';
  const pageDescription = profile?.is_seller
    ? 'Manage your FreshCart seller account, view orders, update store location, and list products.'
    : 'Manage your FreshCart account, view your orders, update your profile, and contact support.';

  // Debounced address fetch
  const debouncedFetchAddress = useCallback(
    debounce(async (lat, lon) => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'FreshCart/1.0' } }
        );
        if (!resp.ok) throw new Error('Failed to fetch address');
        const data = await resp.json();
        setAddress(data.display_name || 'Address not found');
      } catch (e) {
        console.error('fetchAddress error', e);
        setAddress('Error fetching address');
      }
    }, 500),
    []
  );

  // Determine distance status
  const checkSellerDistance = useCallback(
    (sellerLoc, userLoc) => {
      if (!sellerLoc || !userLoc) {
        setDistanceStatus('Unable to calculate distance due to missing location data.');
        return;
      }
      const dist = calculateDistance(userLoc, sellerLoc);
      if (dist === null) {
        setDistanceStatus('Unable to calculate distance.');
      } else if (dist <= 40) {
        setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
      } else {
        setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
      }
    },
    []
  );

  // Load user data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!session?.user?.id) {
        navigate('/auth', { replace: true });
        return;
      }
      setUser(session.user);

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profErr) throw new Error(`Failed to fetch profile: ${profErr.message}`);
      if (!prof) {
        navigate('/auth', { replace: true });
        return;
      }
      setProfile(prof);
      setFullName(prof.full_name || '');
      setPhoneNumber(prof.phone_number || '');

      if (prof.is_seller) {
        const { data: sel, error: selErr } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (selErr) throw new Error(`Failed to fetch seller data: ${selErr.message}`);
        setSeller(sel || null);

        if (sel?.latitude && sel?.longitude) {
          const newLoc = { lat: sel.latitude, lon: sel.longitude };
          setSellerLocation(newLoc);
          debouncedFetchAddress(sel.latitude, sel.longitude);
          checkSellerDistance(newLoc, buyerLocation);
        }

        const { data: prods = [], error: prodErr } = await supabase
          .from('products')
          .select('id, title, price, images')
          .eq('seller_id', session.user.id)
          .eq('is_approved', true)
          .range((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE - 1);
        if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);
        setProducts(prods);

        const { data: sOrders = [], error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            estimated_delivery,
            order_items (
              product_id,
              quantity,
              price,
              variant_id,
              products (id, title, images)
            ),
            emi_applications!orders_emi_application_uuid_fkey (
              product_name,
              product_price,
              full_name,
              mobile_number,
              status
            ),
            profiles!orders_user_id_fkey (
              email
            )
          `)
          .eq('seller_id', session.user.id)
          .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
        if (orderError) throw new Error(`Failed to fetch seller orders: ${orderError.message}`);

        const variantIds = sOrders
          .flatMap((order) => order.order_items || [])
          .filter((item) => item.variant_id)
          .map((item) => item.variant_id);
        let variantData = [];
        if (variantIds.length > 0) {
          const { data: variants, error: variantError } = await supabase
            .from('product_variants')
            .select('id, attributes, images, price')
            .in('id', [...new Set(variantIds)]);
          if (variantError) throw new Error(`Failed to fetch variants: ${variantError.message}`);
          variantData = variants || [];
        }

        const updatedOrders = sOrders.map((order) => ({
          ...order,
          order_items: order.order_items?.map((item) => ({
            ...item,
            product_variants: item.variant_id ? variantData.filter((v) => v.id === item.variant_id) : [],
          })) || [],
          isNew: location.state?.newOrderIds?.includes(order.id) || false,
        }));
        setOrders(updatedOrders);
      } else {
        const { data: bOrders = [], error: buyerOrderError } = await supabase
          .from('orders')
          .select(`
            *,
            estimated_delivery,
            order_items (
              product_id,
              quantity,
              price,
              products (id, title, images)
            ),
            emi_applications!orders_emi_application_uuid_fkey (
              product_name,
              product_price,
              full_name,
              mobile_number,
              status,
              seller_name
            ),
            profiles!orders_seller_id_fkey (
              id
            )
          `)
          .eq('user_id', session.user.id)
          .range((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE - 1);
        if (buyerOrderError) throw new Error(`Failed to fetch buyer orders: ${buyerOrderError.message}`);

        const sellerProfileIds = [...new Set(bOrders.map((order) => order.profiles?.id).filter((id) => id))];
        let sellersData = [];
        if (sellerProfileIds.length > 0) {
          const { data: sellers, error: sellersError } = await supabase
            .from('sellers')
            .select('id, store_name')
            .in('id', sellerProfileIds);
          if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);
          sellersData = sellers || [];
        }

        const updatedOrders = bOrders.map((order) => ({
          ...order,
          sellers: sellersData.find((seller) => seller.id === order.profiles?.id) || { store_name: 'Unknown Seller' },
          isNew: location.state?.newOrderIds?.includes(order.id) || false,
        }));
        setOrders(updatedOrders);
      }
    } catch (e) {
      console.error('fetchUserData error', e);
      setError(`Failed to load account: ${e.message}. Please try again or contact support.`);
    } finally {
      setLoading(false);
    }
  }, [session, navigate, setSellerLocation, buyerLocation, debouncedFetchAddress, checkSellerDistance, productsPage, ordersPage, location.state]);

  // Save profile updates
  const saveProfile = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phoneNumber })
        .eq('id', session.user.id);
      if (error) throw error;
      setProfile((prev) => ({ ...prev, full_name: fullName, phone_number: phoneNumber }));
      setEditProfile(false);
      setLocationMessage('Profile updated successfully.');
    } catch (e) {
      console.error('saveProfile error', e);
      setLocationMessage('Error updating profile. Please try again.');
    }
  }, [fullName, phoneNumber, session]);

  // Update seller location manually
  const handleManualLocationUpdate = useCallback(async () => {
    if (!manualLat || !manualLon) {
      setLocationMessage('Please enter both latitude and longitude.');
      return;
    }
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocationMessage('Invalid latitude or longitude values.');
      return;
    }
    try {
      const { error: rpcErr } = await supabase.rpc('set_seller_location', {
        seller_uuid: user.id,
        user_lat: lat,
        user_lon: lon,
        store_name_input: seller?.store_name || 'Store',
      });
      if (rpcErr) throw rpcErr;
      const newLoc = { lat, lon };
      setSellerLocation(newLoc);
      debouncedFetchAddress(lat, lon);
      checkSellerDistance(newLoc, buyerLocation);
      setLocationMessage('Location updated successfully.');
      setShowManualLocation(false);
      setManualLat('');
      setManualLon('');
    } catch (e) {
      console.error('manualLocationUpdate error', e);
      setLocationMessage('Error updating location. Please try again.');
    }
  }, [manualLat, manualLon, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

  // Detect & set seller location via RPC
  const handleDetectLocation = useCallback(() => {
    if (!profile?.is_seller) {
      setLocationMessage('Only sellers can update location.');
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
      setShowManualLocation(true);
      return;
    }
    setLocationMessage('Detecting...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const { error: rpcErr } = await supabase.rpc('set_seller_location', {
            seller_uuid: user.id,
            user_lat: lat,
            user_lon: lon,
            store_name_input: seller?.store_name || 'Store',
          });
          if (rpcErr) throw rpcErr;
          const newLoc = { lat, lon };
          setSellerLocation(newLoc);
          debouncedFetchAddress(lat, lon);
          checkSellerDistance(newLoc, buyerLocation);
          setLocationMessage('Location updated successfully.');
        } catch (e) {
          console.error('detectLocation RPC error', e);
          setLocationMessage('Error updating location. Please try manually.');
          setShowManualLocation(true);
        }
      },
      (err) => {
        setLocationMessage('Location permission denied or timed out. Please enter manually.');
        setShowManualLocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [profile, user, seller, setSellerLocation, debouncedFetchAddress, checkSellerDistance, buyerLocation]);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      try {
        const currentOrder = orders.find((o) => o.id === orderId);
        const currentStatus = currentOrder.order_status;
        if (!validTransitions[currentStatus]?.includes(status)) {
          throw new Error(
            `Invalid status transition from ${currentStatus} to ${status}. Valid transitions are: ${validTransitions[
              currentStatus
            ].join(', ')}.`
          );
        }
        const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
        if (error) throw error;
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: status } : o)));
        setLocationMessage(`Order #${orderId} status updated to ${status}.`);
      } catch (e) {
        console.error('updateOrderStatus error:', e);
        setLocationMessage(`Failed to update order status: ${e.message}`);
      }
    },
    [orders, validTransitions]
  );

  // Update EMI status
  const updateEmiStatus = useCallback(
    async (orderId, emiApplicationId, newStatus) => {
      try {
        const { error: emiError } = await supabase
          .from('emi_applications')
          .update({ status: newStatus })
          .eq('id', emiApplicationId);
        if (emiError) throw emiError;

        let orderStatusUpdate = 'pending';
        if (newStatus === 'approved') {
          orderStatusUpdate = 'Order Placed';
          setLocationMessage('EMI application approved successfully! The buyer will be happy.');
        } else if (newStatus === 'rejected') {
          orderStatusUpdate = 'Cancelled';
          setLocationMessage('EMI application rejected. Notifying buyer to retry with a different payment method.');
          setRetryOrderId(orderId);
          setShowRetryPaymentModal(true);
        }

        const { error: orderError } = await supabase
          .from('orders')
          .update({ order_status: orderStatusUpdate, updated_at: new Date().toISOString() })
          .eq('id', orderId);
        if (orderError) throw orderError;

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  order_status: orderStatusUpdate,
                  emi_applications: { ...o.emi_applications, status: newStatus },
                }
              : o
          )
        );
        setEmiStatusUpdates((prev) => ({ ...prev, [orderId]: '' }));
      } catch (e) {
        console.error('updateEmiStatus error', e);
        setLocationMessage('Failed to update EMI status. Please try again.');
      }
    },
    []
  );

  // Retry payment with a different method
  const handleRetryPayment = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: newPaymentMethod, order_status: 'Order Placed', updated_at: new Date().toISOString() })
        .eq('id', retryOrderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === retryOrderId
            ? { ...o, payment_method: newPaymentMethod, order_status: 'Order Placed' }
            : o
        )
      );
      setShowRetryPaymentModal(false);
      setRetryOrderId(null);
      setNewPaymentMethod('credit_card');
      setLocationMessage('Payment method updated successfully. Order placed.');
    } catch (e) {
      console.error('retryPayment error', e);
      setLocationMessage('Failed to update payment method. Please try again.');
    }
  }, [retryOrderId, newPaymentMethod]);

  // Cancel order
  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!cancelReason) {
        setLocationMessage('Please select a cancellation reason.');
        return;
      }
      try {
        const { error } = await supabase
          .from('orders')
          .update({ order_status: 'Cancelled', cancellation_reason: cancelReason })
          .eq('id', orderId);
        if (error) throw error;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, order_status: 'Cancelled', cancellation_reason: cancelReason } : o
          )
        );
        setCancelOrderId(null);
        setCancelReason('');
        setIsCustomReason(false);
        setLocationMessage('Order cancelled successfully.');
      } catch (e) {
        console.error('cancelOrder error', e);
        setLocationMessage('Error cancelling order. Please try again.');
      }
    },
    [cancelReason]
  );

  // Handle support form submission
  const handleSupportSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      setLocationMessage('Please enter a support message.');
      return;
    }
    try {
      const { error } = await supabase.from('support_requests').insert({
        user_id: session.user.id,
        message: supportMessage,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSupportMessage('');
      setLocationMessage('Support request submitted successfully.');
    } catch (e) {
      console.error('supportSubmit error', e);
      setLocationMessage('Failed to submit support request. Please try again.');
    }
  }, [supportMessage, session]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSellerLocation(null); // Reset location context
      setLocationMessage('Logged out successfully.');
      navigate('/', { replace: true }); // Redirect to homepage
    } catch (e) {
      console.error('logout error', e);
      setLocationMessage('Error logging out. Please try again.');
    }
  }, [navigate, setSellerLocation]);

  // Memoized orders with skeleton data while loading
  const displayedOrders = useMemo(() => {
    if (loading) {
      return [...Array(3)].map((_, i) => ({
        id: `skeleton-${i}`,
        total: 0,
        order_status: 'Loading',
        order_items: [{ products: { title: 'Loading...', images: ['https://dummyimage.com/150'] } }],
      }));
    }
    return orders;
  }, [loading, orders]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (location.state?.newOrderIds) {
      setLocationMessage('New orders placed successfully! Check below.');
    }
  }, [location.state]);

  if (error) {
    return (
      <div className="td-account-error">
        <Helmet>
          <title>Error - FreshCart</title>
          <meta name="description" content="An error occurred while loading your FreshCart account. Please try again." />
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={pageUrl} />
        </Helmet>
        {error}
        <button onClick={fetchUserData} className="td-retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="td-account-container">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="account, dashboard, orders, profile, ecommerce, FreshCart"
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta
          property="og:image"
          content={products[0]?.images?.[0] || defaultImage}
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta
          name="twitter:image"
          content={products[0]?.images?.[0] || defaultImage}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: pageTitle,
            description: pageDescription,
            url: pageUrl,
            publisher: {
              '@type': 'Organization',
              name: 'FreshCart',
            },
          })}
        </script>
      </Helmet>
      <header className="td-account-header">
        <h1 className="td-account-title">FreshCart Account Dashboard</h1>
      </header>

      <section className="td-account-section">
        <h2 className="td-section-heading">
          <FaUser className="td-user-icon" /> My Profile
        </h2>
        <div className="td-profile-info">
          {editProfile ? (
            <>
              <p>
                Email: <span>{user?.email || 'Not set'}</span>
              </p>
              <p>
                Full Name:{' '}
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="td-profile-input"
                  aria-describedby="full-name-error"
                />
              </p>
              <p>
                Phone:{' '}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="td-profile-input"
                  aria-describedby="phone-error"
                />
              </p>
              <button onClick={saveProfile} className="td-btn-save-profile">
                Save
              </button>
              <button onClick={() => setEditProfile(false)} className="td-btn-cancel-edit">
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>
                Email: <span>{user?.email || 'Not set'}</span>
              </p>
              <p>
                Full Name: <span>{profile?.full_name || 'Not set'}</span>
              </p>
              <p>
                Phone: <span>{profile?.phone_number || 'Not set'}</span>
              </p>
              <div className="td-profile-actions">
                <button onClick={() => setEditProfile(true)} className="td-btn-edit-profile" aria-label="Edit profile">
                  Edit Profile
                </button>
                <button onClick={handleLogout} className="td-btn-logout" aria-label="Log out">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {profile?.is_seller && (
          <div className="td-seller-location">
            <p>
              Store Location: <span>{address}</span>
            </p>
            <p className={distanceStatus.includes('Warning') ? 'td-distance-status warning' : 'td-distance-status'}>
              {distanceStatus}
            </p>
            <button onClick={handleDetectLocation} className="td-btn-location" aria-label="Detect or update location">
              Detect/Update Location
            </button>
            {showManualLocation && (
              <div className="td-manual-location">
                <p>Enter location manually:</p>
                <input
                  type="number"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Latitude (-90 to 90)"
                  className="td-manual-input"
                  aria-describedby="lat-error"
                />
                <input
                  type="number"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="Longitude (-180 to 180)"
                  className="td-manual-input"
                  aria-describedby="lon-error"
                />
                <button onClick={handleManualLocationUpdate} className="td-btn-location">
                  Submit Manual Location
                </button>
              </div>
            )}
            {locationMessage && <p className="td-location-message">{locationMessage}</p>}
            <Link to="/seller" className="td-btn-seller-dashboard" aria-label="Go to seller dashboard">
              Go to Seller Dashboard
            </Link>
          </div>
        )}
      </section>

      {profile?.is_seller && (
        <section className="td-account-section">
          <h2 className="td-section-heading">My Products</h2>
          {loading ? (
            <div className="td-product-grid">
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className="td-product-card-skeleton">
                  <div className="td-skeleton-image" />
                  <div className="td-skeleton-text" />
                  <div className="td-skeleton-text short" />
                  <div className="td-skeleton-btn" />
                </div>
              ))}
            </div>
          ) : products.length ? (
            <>
              <div className="td-product-grid">
                {products.map((prod) => (
                  <div key={prod.id} className="td-product-card">
                    <div className="td-product-image-wrapper">
                      <img
                        src={prod.images[0] || 'https://dummyimage.com/150'}
                        alt={prod.title || 'Product'}
                        onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
                        className="td-product-image"
                      />
                    </div>
                    <h3 className="td-product-name">{prod.title}</h3>
                    <p className="td-product-price">₹{prod.price.toLocaleString('en-IN')}</p>
                    <Link to={`/product/${prod.id}`} className="td-btn-view-product" aria-label={`View ${prod.title}`}>
                      View
                    </Link>
                  </div>
                ))}
              </div>
              <div className="td-pagination">
                <button
                  onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={productsPage === 1}
                  className="td-btn-pagination"
                >
                  Previous
                </button>
                <button
                  onClick={() => setProductsPage((prev) => prev + 1)}
                  disabled={products.length < ITEMS_PER_PAGE}
                  className="td-btn-pagination"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="td-no-products">No products added yet.</p>
          )}
        </section>
      )}

      <section className="td-account-section">
        <h2 className="td-section-heading">{profile?.is_seller ? 'Orders Received' : 'My Orders'}</h2>
        {loading ? (
          <div className="td-orders-list">
            {[...Array(3)].map((_, i) => (
              <div key={`skeleton-${i}`} className="td-order-item-skeleton">
                <div className="td-skeleton-text" />
                <div className="td-skeleton-text short" />
                <div className="td-skeleton-text short" />
                <div className="td-skeleton-product">
                  <div className="td-skeleton-image" />
                  <div className="td-skeleton-text" />
                </div>
                <div className="td-skeleton-btn" />
              </div>
            ))}
          </div>
        ) : orders.length ? (
          <>
            <div className="td-orders-list">
              {displayedOrders.map((order) => (
                <div key={order.id} className={`td-order-item ${order.isNew ? 'td-order-item-new' : ''}`}>
                  <h3 className="td-order-item-title">
                    Order #{String(order.id).startsWith('skeleton-') ? String(order.id).replace('skeleton-', '') : order.id}
                    {order.isNew && <span className="td-new-order-badge">New</span>}
                  </h3>
                  <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
                  <p>Status: {order.order_status}</p>
                  {order.order_status === 'Cancelled' && <p>Reason: {order.cancellation_reason}</p>}
                  {order.payment_method === 'emi' && order.order_status === 'pending' && (
                    <p className="td-emi-pending">(Waiting for Approval)</p>
                  )}
                  {order.estimated_delivery && (
                    <p>
                      Estimated Delivery: {new Date(order.estimated_delivery).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>
                  )}
                  {order.payment_method === 'emi' ? (
                    <div className="td-order-products">
                      <h4 className="td-order-products-title">Items:</h4>
                      <div className="td-order-product">
                        <div className="td-order-product-details">
                          <p>
                            {order.emi_applications?.product_name || 'N/A'} - ₹
                            {(order.emi_applications?.product_price || 0).toLocaleString('en-IN')}
                          </p>
                          {profile?.is_seller && (
                            <>
                              <p>
                                Buyer: {order.emi_applications?.full_name || 'Unknown'} (
                                {order.profiles?.email || 'N/A'})
                              </p>
                              <p>Buyer Contact: {order.emi_applications?.mobile_number || 'N/A'}</p>
                            </>
                          )}
                          {!profile?.is_seller && order.sellers?.store_name && (
                            <p>Seller: {order.sellers.store_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="td-order-products">
                      <h4 className="td-order-products-title">Items:</h4>
                      {order.order_items?.length > 0 ? (
                        order.order_items.map((item, idx) => {
                          const variant = item.variant_id && Array.isArray(item.product_variants)
                            ? item.product_variants.find((v) => v.id === item.variant_id) || null
                            : null;
                          const variantAttributes = variant?.attributes
                            ? Object.entries(variant.attributes)
                                .filter(([key, val]) => val)
                                .map(([key, val]) => `${key}: ${val}`)
                                .join(', ') || 'No variant details available'
                            : 'No variant selected';
                          const displayImages =
                            variant?.images && Array.isArray(variant.images) && variant.images.length > 0
                              ? variant.images
                              : item.products?.images && Array.isArray(item.products.images) && item.products.images.length > 0
                              ? item.products.images
                              : ['https://dummyimage.com/150'];
                          const displayPrice = variant?.price || item.price;

                          return (
                            <div key={idx} className="td-order-product">
                              <div className="td-product-image-wrapper">
                                <img
                                  src={displayImages[0]}
                                  alt={item.products?.title || 'Product'}
                                  onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
                                  className="td-product-image"
                                />
                              </div>
                              <div className="td-order-product-details">
                                <p className="td-order-product-title">
                                  {item.products?.title || 'Product'} x{item.quantity} @ ₹
                                  {displayPrice.toLocaleString('en-IN')}
                                </p>
                                <p className="td-variant-details">Variant: {variantAttributes}</p>
                                {!profile?.is_seller && order.sellers?.store_name && (
                                  <p>Seller: {order.sellers.store_name}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p>No items in this order.</p>
                      )}
                    </div>
                  )}

                  {String(order.id).startsWith('skeleton-') ? null : (
                    <>
                      {profile?.is_seller ? (
                        <>
                          {order.payment_method === 'emi' && order.emi_applications?.status === 'pending' && (
                            <div className="td-update-emi-status">
                              <label>Update EMI Status:</label>
                              <select
                                value={emiStatusUpdates[order.id] || order.emi_applications.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  setEmiStatusUpdates((prev) => ({ ...prev, [order.id]: newStatus }));
                                  updateEmiStatus(order.id, order.emi_application_uuid, newStatus);
                                }}
                                className="td-select"
                                aria-label={`Update EMI status for order ${order.id}`}
                              >
                                {emiStatuses.map((s) => (
                                  <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
                            <div className="td-update-status">
                              <label>Update Status:</label>
                              <select
                                value={order.order_status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="td-select"
                                aria-label={`Update status for order ${order.id}`}
                              >
                                <option value={order.order_status}>{order.order_status} (Current)</option>
                                {validTransitions[order.order_status]?.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      ) : (
                        order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' ? (
                          <button
                            onClick={() => setCancelOrderId(order.id)}
                            className="td-btn-cancel-order"
                            aria-label={`Cancel order ${order.id}`}
                          >
                            Cancel Order
                          </button>
                        ) : null
                      )}
                      <Link
                        to={`/order-details/${order.id}`}
                        className="td-btn-view-details"
                        aria-label={`View details for order ${order.id}`}
                      >
                        Details
                      </Link>
                    </>
                  )}

                  {cancelOrderId === order.id && (
                    <div className="td-cancel-modal" role="dialog" aria-labelledby={`cancel-modal-${order.id}`}>
                      <h3 id={`cancel-modal-${order.id}`}>Cancel Order #{order.id}</h3>
                      <select
                        value={cancelReason}
                        onChange={(e) => {
                          setCancelReason(e.target.value);
                          setIsCustomReason(e.target.value === 'Other (please specify)');
                        }}
                        aria-label="Select cancellation reason"
                      >
                        <option value="">Select reason</option>
                        {(profile?.is_seller ? sellerCancelReasons : buyerCancelReasons).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {isCustomReason && (
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Custom reason"
                          aria-label="Custom cancellation reason"
                          className="td-custom-reason-input"
                        />
                      )}
                      <div className="td-cancel-modal-buttons">
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="td-btn-confirm-cancel"
                          aria-label="Confirm order cancellation"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setCancelOrderId(null);
                            setCancelReason('');
                            setIsCustomReason(false);
                          }}
                          className="td-btn-close-cancel"
                          aria-label="Close cancellation modal"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="td-pagination">
              <button
                onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
                disabled={ordersPage === 1}
                className="td-btn-pagination"
              >
                Previous
              </button>
              <button
                onClick={() => setOrdersPage((prev) => prev + 1)}
                disabled={orders.length < ITEMS_PER_PAGE}
                className="td-btn-pagination"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className={profile?.is_seller ? 'td-no-orders' : 'td-no-orders'}>
            {profile?.is_seller ? 'No orders on your products' : 'You have no orders yet.'}
          </p>
        )}
      </section>

      <section className="td-account-section">
        <h2 className="td-section-heading">Support</h2>
        <div className="td-support">
          <h1 className="td-support-title">Support</h1>
          <p className="td-support-text">
            Contact us at{' '}
            <a href="mailto:support@justorder.com" className="td-policy-link">
              support@justorder.com
            </a>{' '}
            or call 8825287284 (Sunil Rawani) for assistance.{' '}
            <a href="https://wa.me/918825287284" target="_blank" rel="noopener noreferrer" className="td-whatsapp-link">
              WhatsApp us
            </a>
            <br />
            Learn more about our{' '}
            <Link to="/policy" className="td-policy-link">
              Policies
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="td-policy-link">
              Privacy Policy
            </Link>
            .
          </p>
          <form onSubmit={handleSupportSubmit}>
            <textarea
              placeholder="Describe your issue..."
              className="td-support-input"
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              aria-describedby="support-error"
            />
            {locationMessage.includes('support') && (
              <p id="support-error" className="td-error-message">
                {locationMessage}
              </p>
            )}
            <button className="td-support-btn" type="submit">
              Submit
            </button>
          </form>
        </div>
      </section>

      {showRetryPaymentModal && (
        <div className="td-cancel-modal" role="dialog" aria-labelledby="retry-payment-modal">
          <h3 id="retry-payment-modal">Retry Payment for Order #{retryOrderId}</h3>
          <p>EMI application was rejected. Please select a different payment method to proceed.</p>
          <select
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            aria-label="Select new payment method"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <div className="td-cancel-modal-buttons">
            <button onClick={handleRetryPayment} className="td-btn-confirm-cancel">
              Confirm Payment
            </button>
            <button onClick={() => setShowRetryPaymentModal(false)} className="td-btn-close-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(Account);