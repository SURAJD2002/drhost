
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



import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { FaUser } from 'react-icons/fa';
import '../style/Account.css';

// Calculate great-circle distance between two coords
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc) return null;
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
  const { buyerLocation, sellerLocation, setSellerLocation, session } = useContext(LocationContext);
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

  const navigate = useNavigate();

  const buyerCancelReasons = ['Changed my mind', 'Found a better price elsewhere', 'Item no longer needed', 'Other (please specify)'];
  const sellerCancelReasons = ['Out of stock', 'Unable to ship', 'Buyer request', 'Other (please specify)'];
  const orderStatuses = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  // Reverse geocode coordinates to address
  const fetchAddress = async (lat, lon) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      if (!resp.ok) throw new Error(resp.statusText);
      const data = await resp.json();
      setAddress(data.display_name || 'Address not found');
    } catch (e) {
      console.error('fetchAddress error', e);
      setAddress('Error fetching address');
    }
  };

  // Determine distance status
  const checkSellerDistance = (sellerLoc, userLoc) => {
    const dist = calculateDistance(userLoc, sellerLoc);
    if (dist == null) {
      setDistanceStatus('Unable to calculate distance.');
    } else if (dist <= 40) {
      setDistanceStatus(`Store is ${dist.toFixed(2)} km from you (within 40km).`);
    } else {
      setDistanceStatus(`Warning: Store is ${dist.toFixed(2)} km away (outside 40km).`);
    }
  };

  // Load profile, seller info, products, orders
  const fetchUserData = useCallback(async () => {
    setLoading(true);
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
      if (profErr) throw profErr;
      if (!prof) {
        navigate('/auth', { replace: true });
        return;
      }
      setProfile(prof);

      if (prof.is_seller) {
        const { data: sel } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setSeller(sel || null);

        if (sel?.latitude != null && sel?.longitude != null) {
          const newLoc = { lat: sel.latitude, lon: sel.longitude };
          setSellerLocation(newLoc);
          await fetchAddress(sel.latitude, sel.longitude);
          checkSellerDistance(newLoc, buyerLocation);
        }

        const { data: prods = [] } = await supabase
          .from('products')
          .select('id, title, price, images')
          .eq('seller_id', session.user.id)
          .eq('is_approved', true);
        setProducts(prods);

        const { data: sOrders = [] } = await supabase
          .from('orders')
          .select('*, order_items (product_id, quantity, price, products (id, title, images))')
          .eq('seller_id', session.user.id);
        setOrders(sOrders);
      } else {
        const { data: bOrders = [] } = await supabase
          .from('orders')
          .select('*, order_items (product_id, quantity, price, products (id, title, images))')
          .eq('user_id', session.user.id);
        setOrders(bOrders);
      }
    } catch (e) {
      console.error('fetchUserData error', e);
      setError('Failed to load account.');
    } finally {
      setLoading(false);
    }
  }, [session, navigate, setSellerLocation, buyerLocation]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // Detect & set seller location via RPC
  const handleDetectLocation = () => {
    if (!profile?.is_seller) return setLocationMessage('Only sellers can update location.');
    if (!navigator.geolocation) return setLocationMessage('Geolocation not supported.');
    setLocationMessage('Detecting...');
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const { error: rpcErr } = await supabase.rpc('set_seller_location', {
          seller_uuid: user.id,
          user_lat: lat,
          user_lon: lon,
          store_name_input: seller?.store_name || 'Store'
        });
        if (rpcErr) throw rpcErr;
        const newLoc = { lat, lon };
        setSellerLocation(newLoc);
        await fetchAddress(lat, lon);
        checkSellerDistance(newLoc, buyerLocation);
        setLocationMessage('Location updated.');
      } catch (e) {
        console.error('detectLocation RPC error', e);
        setLocationMessage('Error updating location.');
      }
    }, err => {
      setLocationMessage('Location permission denied or timed out.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  // Update order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
      setOrders(prev => prev.map(o => o.id===orderId?{...o, order_status:status}:o));
    } catch (e) {
      console.error('updateOrderStatus error', e);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!cancelReason) return setLocationMessage('Select cancellation reason.');
    try {
      await supabase.from('orders').update({ order_status:'Cancelled', cancellation_reason:cancelReason })
        .eq('id', orderId);
      setOrders(prev => prev.map(o => o.id===orderId?{...o, order_status:'Cancelled', cancellation_reason:cancelReason}:o));
      setCancelOrderId(null);
      setCancelReason('');
      setIsCustomReason(false);
    } catch (e) {
      console.error('cancelOrder error', e);
      setLocationMessage('Error cancelling order.');
    }
  };

  if (loading) return <div className="account posa-loading">Loading...</div>;
  if (error) return <div className="account-error">{error}</div>;

  return (
    <div className="account-container">
      <h1 className="account-title">FreshCart Account Dashboard</h1>

      <section className="account-section">
        <h2 className="section-heading"><FaUser className="user-icon" /> My Profile</h2>
        <div className="profile-info">
          <p>Email: <span>{user?.email}</span></p>
          <p>Full Name: <span>{profile?.full_name || 'Not set'}</span></p>
          <p>Phone: <span>{profile?.phone_number || 'Not set'}</span></p>
        </div>
        <Link to="/auth" className="btn-edit-profile">Edit Profile</Link>

        {profile?.is_seller && (
          <div className="seller-location">
            <p>Store Location: <span>{address}</span></p>
            <p className={distanceStatus.includes('Warning')?'distance-status warning':'distance-status'}>{distanceStatus}</p>
            <button onClick={handleDetectLocation} className="btn-location">Detect/Update Location</button>
            {locationMessage && <p className="location-message">{locationMessage}</p>}
            <button onClick={()=>navigate('/seller')} className="btn-seller-dashboard">Go to Seller Dashboard</button>
          </div>
        )}
      </section>

      {profile?.is_seller && (
        <section className="account-section">
          <h2 className="section-heading">My Products</h2>
          {products.length ? (
            <div className="product-grid">
              {products.map(prod=>(
                <div key={prod.id} className="product-card">
                  <img src={prod.images[0]||'https://dummyimage.com/150'} alt={prod.title} onError={e=>e.target.src='https://dummyimage.com/150'} />
                  <h3>{prod.title}</h3>
                  <p>₹{prod.price.toLocaleString('en-IN')}</p>
                  <Link to={`/product/${prod.id}`} className="btn-view-product">View</Link>
                </div>
              ))}
            </div>
          ) : <p>No products added yet.</p>}
        </section>
      )}

      <section className="account-section">
        <h2 className="section-heading">{profile?.is_seller?'Orders Received':'My Orders'}</h2>
        {orders.length ? (
          <div className="orders-list">
            {orders.map(order=>(
              <div key={order.id} className="order-item">
                <h3>Order #{order.id}</h3>
                <p>Total: ₹{(order.total||0).toLocaleString('en-IN')}</p>
                <p>Status: {order.order_status}</p>
                {order.order_status==='Cancelled'&&<p>Reason: {order.cancellation_reason}</p>}

                <div className="order-products">
                  <h4>Items:</h4>
                  {order.order_items?.map((item,idx)=>(
                    <div key={idx} className="order-product">
                      <img src={item.products?.images?.[0]||'https://dummyimage.com/150'} alt={item.products?.title} onError={e=>e.target.src='https://dummyimage.com/150'} />
                      <p>{item.products?.title||'Product'} x{item.quantity} @ ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>

                {order.order_status!=='Cancelled' && (
                  <>
                    {profile?.is_seller ? (
                      <div className="update-status">
                        <label>Update Status:</label>
                        <select value={order.order_status} onChange={e=>updateOrderStatus(order.id,e.target.value)}>
                          {orderStatuses.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ) : (
                      <button onClick={()=>setCancelOrderId(order.id)} className="btn-cancel-order">Cancel Order</button>
                    )}
                    <Link to={`/order-details/${order.id}`} className="btn-view-details">Details</Link>
                  </>
                )}

                {cancelOrderId===order.id && (
                  <div className="cancel-modal">
                    <h3>Cancel Order #{order.id}</h3>
                    <select value={cancelReason} onChange={e=>{setCancelReason(e.target.value);setIsCustomReason(e.target.value==='Other (please specify)');}}>
                      <option value="">Select reason</option>
                      {(profile?.is_seller? sellerCancelReasons: buyerCancelReasons).map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                    {isCustomReason && <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Custom reason" />}
                    <div className="cancel-modal-buttons">
                      <button onClick={()=>handleCancelOrder(order.id)} className="btn-confirm-cancel">Confirm</button>
                      <button onClick={()=>{setCancelOrderId(null);setCancelReason('');setIsCustomReason(false);}} className="btn-close-cancel">Close</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>{profile?.is_seller?'No orders on your products':'You have no orders yet.'}</p>
        )}
      </section>
    </div>
  );
}

export default Account;
