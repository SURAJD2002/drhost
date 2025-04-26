
// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import {
//   FaStore,
//   FaBox,
//   FaTruck,
//   FaPlus,
//   FaTrash,
//   FaMapMarkerAlt,
// } from 'react-icons/fa';
// import '../style/SellerDashboard.css';

// function SellerDashboard() {
//   const navigate = useNavigate();
//   const { sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   const fetchSellerData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .single();
//       if (profileError || !profile?.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         setLoading(false);
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, full_name, phone_number)')
//         .eq('id', sellerId)
//         .single();
//       if (sellerError) throw sellerError;
//       setSeller(sellerData);

//       if (sellerData.latitude && sellerData.longitude) {
//         setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//         await fetchAddress(sellerData.latitude, sellerData.longitude);
//       }

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       setProducts(productsData || []);

//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items(*, products(title, price))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error('Error fetching seller data:', err);
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

//   const handleDetectLocation = async () => {
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
//             .eq('id', seller.id)
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
//             seller_uuid: seller.id,
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
//           setLocationMessage(
//             `Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`
//           );
//           fetchSellerData();
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

//   const deleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) return;
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('You must be logged in.');
//         setLoading(false);
//         return;
//       }
//       const sellerId = session.user.id;
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', sellerId);
//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error deleting product:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOrderClick = (orderId) => {
//     navigate(`/order-details/${orderId}`);
//   };

//   const handleAddProduct = () => {
//     if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//       setMessage('Please set your store location in the Account page or here before adding products.');
//       return;
//     }
//     navigate('/seller/add-product');
//   };

//   useEffect(() => {
//     fetchSellerData();
//     fetchCategories();
//   }, [fetchSellerData, fetchCategories]);

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error) return <div className="error" style={{ color: 'red' }}>{error}</div>;
//   if (!seller) return <div className="not-found">Seller not found.</div>;

//   return (
//     <div className="seller-dashboard" style={{ padding: '20px' }}>
//       <h1>Seller Dashboard - {seller.store_name || 'Unnamed Store'}</h1>
//       {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}

//       <section className="seller-info" style={{ marginBottom: '20px' }}>
//         <h2>
//           <FaStore /> Store Details
//         </h2>
//         <p>Email: <span>{seller.profiles.email}</span></p>
//         <p>Name: <span>{seller.profiles.full_name}</span></p>
//         <p>Phone: <span>{seller.profiles.phone_number || 'Not set'}</span></p>
//         <p>Location: <span>{address}</span></p>
//         <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//         <button onClick={handleDetectLocation} className="btn-location">
//           {sellerLocation ? 'Update Location' : 'Detect & Set Location'} <FaMapMarkerAlt style={{ marginLeft: '5px' }} />
//         </button>
//         {locationMessage && (
//           <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//             {locationMessage}
//           </p>
//         )}
//       </section>

//       <section className="products-section" style={{ marginBottom: '20px' }}>
//         <h2>
//           <FaBox /> My Products
//         </h2>
//         <button onClick={handleAddProduct} className="btn-add" style={{ marginBottom: '10px' }}>
//           <FaPlus /> Add Product
//         </button>
//         {products.length === 0 ? (
//           <p>No products found.</p>
//         ) : (
//           <div className="product-list">
//             {products.map((prod) => (
//               <div key={prod.id} className="product-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
//                 <h3>{prod.title}</h3>
//                 <p>Price: ₹{prod.price?.toLocaleString('en-IN') || 'N/A'}</p>
//                 <p>Stock: {prod.stock || 'N/A'}</p>
//                 {prod.images && prod.images.length > 0 ? (
//                   prod.images.map((img, i) => (
//                     <img
//                       key={i}
//                       src={img}
//                       alt={`Product ${i}`}
//                       style={{ width: '80px', marginRight: '5px' }}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/80'; }}
//                     />
//                   ))
//                 ) : (
//                   <p>No images</p>
//                 )}
//                 <Link to={`/product/${prod.id}`} className="btn-view" style={{ marginLeft: '10px' }}>
//                   View
//                 </Link>
//                 <button
//                   onClick={() => deleteProduct(prod.id)}
//                   className="btn-delete"
//                   style={{ marginLeft: '10px', color: 'red' }}
//                 >
//                   <FaTrash /> Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="orders-section" style={{ marginBottom: '20px' }}>
//         <h2>
//           <FaTruck /> Buyer Orders
//         </h2>
//         {orders.length === 0 ? (
//           <p>No orders found.</p>
//         ) : (
//           <div className="order-list">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="order-item"
//                 style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
//                 onClick={() => handleOrderClick(order.id)}
//               >
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ₹{order.total?.toLocaleString('en-IN') || '0'}</p>
//                 <p>Status: {order.order_status || 'N/A'}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// export default SellerDashboard;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaStore, FaBox, FaTruck, FaPlus, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
// import '../style/SellerDashboard.css';

// function SellerDashboard() {
//   const navigate = useNavigate();
//   const { sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   const fetchSellerData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('You must be logged in.');
//         navigate('/auth');
//         return;
//       }
//       const sellerId = session.user.id;

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .single();
//       if (profileError || !profile?.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         navigate('/account');
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, full_name, phone_number)')
//         .eq('id', sellerId)
//         .single();
//       if (sellerError) throw sellerError;
//       setSeller(sellerData);

//       if (sellerData.latitude && sellerData.longitude) {
//         setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//         await fetchAddress(sellerData.latitude, sellerData.longitude);
//       }

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('id, title, price, images, stock, product_variants (id, attributes, price, stock, images)')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       const mappedProducts = productsData.map((product) => {
//         const variants = product.product_variants || [];
//         const primaryVariant = variants.length > 0 ? variants[0] : null;
//         return {
//           id: product.id,
//           title: product.title || 'Unnamed Product',
//           price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//           stock: primaryVariant?.stock ?? product.stock ?? 0,
//           images: primaryVariant?.images?.length > 0
//             ? primaryVariant.images
//             : product.images?.length > 0
//               ? product.images
//               : ['https://dummyimage.com/150'],
//           variants: variants.map(variant => ({
//             id: variant.id,
//             attributes: variant.attributes,
//             price: variant.price,
//             stock: variant.stock,
//             images: variant.images,
//           })),
//         };
//       });
//       setProducts(mappedProducts);

//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items (product_id, quantity, price, products (title, images))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error('Error fetching seller data:', err);
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

//   const handleDetectLocation = async () => {
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
//           if (!seller?.id) throw new Error('Seller ID not available');

//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long')
//             .eq('id', seller.id)
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
//             seller_uuid: seller.id,
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
//           setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
//           fetchSellerData(); // Refresh data after location update
//         } catch (err) {
//           console.error('Error updating location:', err);
//           setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const deleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) return;
//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', seller.id);
//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error deleting product:', err);
//       setError(`Error deleting product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOrderClick = (orderId) => {
//     navigate(`/order-details/${orderId}`);
//   };

//   const handleAddProduct = () => {
//     if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//       setError('Please set your store location before adding products.');
//       return;
//     }
//     navigate('/seller/add-product');
//   };

//   useEffect(() => {
//     fetchSellerData();
//     fetchCategories();
//   }, [fetchSellerData, fetchCategories]);

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error && !seller) return <div className="error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="seller-dashboard" style={{ padding: '20px' }}>
//       <h1>Seller Dashboard - {seller?.store_name || 'Unnamed Store'}</h1>
//       {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
//       {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

//       <section className="seller-info" style={{ marginBottom: '20px' }}>
//         <h2><FaStore /> Store Details</h2>
//         <p>Email: <span>{seller?.profiles.email}</span></p>
//         <p>Name: <span>{seller?.profiles.full_name || 'Not set'}</span></p>
//         <p>Phone: <span>{seller?.profiles.phone_number || 'Not set'}</span></p>
//         <p>Location: <span>{address}</span></p>
//         <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//         <button onClick={handleDetectLocation} className="btn-location">
//           {sellerLocation ? 'Update Location' : 'Detect & Set Location'} <FaMapMarkerAlt style={{ marginLeft: '5px' }} />
//         </button>
//         {locationMessage && (
//           <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//             {locationMessage}
//           </p>
//         )}
//       </section>

//       <section className="products-section" style={{ marginBottom: '20px' }}>
//         <h2><FaBox /> My Products</h2>
//         <button onClick={handleAddProduct} className="btn-add" style={{ marginBottom: '10px' }}>
//           <FaPlus /> Add Product
//         </button>
//         {products.length === 0 ? (
//           <p>No products found.</p>
//         ) : (
//           <div className="product-list">
//             {products.map((prod) => (
//               <div key={prod.id} className="product-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
//                 <h3>{prod.title}</h3>
//                 <p>Price: ₹{(prod.price || 0).toLocaleString('en-IN')}</p>
//                 <p>Stock: {prod.stock}</p>
//                 {prod.images?.length > 0 && (
//                   prod.images.map((img, i) => (
//                     <img
//                       key={i}
//                       src={img}
//                       alt={`Product ${i}`}
//                       style={{ width: '80px', marginRight: '5px' }}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/80'; }}
//                     />
//                   ))
//                 )}
//                 {prod.variants.length > 0 && (
//                   <div className="variant-list">
//                     <h4>Variants:</h4>
//                     {prod.variants.map((variant) => (
//                       <div key={variant.id} className="variant-item">
//                         <p>
//                           {Object.entries(variant.attributes)
//                             .filter(([_, value]) => value)
//                             .map(([key, value]) => `${key}: ${value}`)
//                             .join(', ')}
//                         </p>
//                         <p>Price: ₹{(variant.price || 0).toLocaleString('en-IN')}</p>
//                         <p>Stock: {variant.stock}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 <Link to={`/product/${prod.id}`} className="btn-view" style={{ marginLeft: '10px' }}>
//                   View
//                 </Link>
//                 <button
//                   onClick={() => deleteProduct(prod.id)}
//                   className="btn-delete"
//                   style={{ marginLeft: '10px', color: 'red' }}
//                 >
//                   <FaTrash /> Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="orders-section" style={{ marginBottom: '20px' }}>
//         <h2><FaTruck /> Buyer Orders</h2>
//         {orders.length === 0 ? (
//           <p>No orders found.</p>
//         ) : (
//           <div className="order-list">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="order-item"
//                 style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
//                 onClick={() => handleOrderClick(order.id)}
//               >
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status || 'N/A'}</p>
//                 {order.order_items?.length > 0 && (
//                   <div>
//                     <h4>Items:</h4>
//                     {order.order_items.map((item, idx) => (
//                       <p key={`${item.product_id}-${idx}`}>
//                         {item.products?.title || 'Unnamed Product'} - Qty: {item.quantity}
//                       </p>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// export default SellerDashboard;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaStore, FaBox, FaTruck, FaPlus, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
// import MapComponent from './MapComponent';
// import '../style/SellerDashboard.css';

// function SellerDashboard() {
//   const navigate = useNavigate();
//   const { sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   const fetchSellerData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('You must be logged in.');
//         navigate('/auth');
//         return;
//       }
//       const sellerId = session.user.id;

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .maybeSingle();
//       if (profileError) throw profileError;
//       if (!profile?.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         navigate('/account');
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, full_name, phone_number)')
//         .eq('id', sellerId)
//         .maybeSingle();
//       if (sellerError) throw sellerError;
//       setSeller(sellerData);

//       if (sellerData?.latitude && sellerData?.longitude) {
//         setSellerLocation({ lat: sellerData.latitude, lon: sellerData.longitude });
//         await fetchAddress(sellerData.latitude, sellerData.longitude);
//       }

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('id, title, price, images, stock, product_variants (id, attributes, price, stock, images)')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       const mappedProducts = productsData.map((product) => {
//         const variants = product.product_variants || [];
//         const primaryVariant = variants.length > 0 ? variants[0] : null;
//         return {
//           id: product.id,
//           title: product.title || 'Unnamed Product',
//           price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//           stock: primaryVariant?.stock ?? product.stock ?? 0,
//           images: primaryVariant?.images?.length > 0
//             ? primaryVariant.images
//             : product.images?.length > 0
//               ? product.images
//               : ['https://dummyimage.com/150'],
//           variants: variants.map(variant => ({
//             id: variant.id,
//             attributes: variant.attributes,
//             price: variant.price,
//             stock: variant.stock,
//             images: variant.images,
//           })),
//         };
//       });
//       setProducts(mappedProducts);

//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items (product_id, quantity, price, products (title, images))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error('Error fetching seller data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const fetchAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//       );
//       if (!response.ok) {
//         throw new Error(`Mapbox Geocoding failed: ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data.features?.[0]?.place_name) {
//         setAddress(data.features[0].place_name);
//         return data.features[0].place_name;
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

//   const handleDetectLocation = async () => {
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
//           if (!seller?.id) throw new Error('Seller ID not available');

//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long')
//             .eq('id', seller.id)
//             .maybeSingle();
//           if (fetchError) throw fetchError;

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
//             seller_uuid: seller.id,
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
//           setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
//           fetchSellerData();
//         } catch (err) {
//           console.error('Error updating location:', err);
//           setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const handleMapLocationSelect = async (location) => {
//     try {
//       if (!seller?.id) throw new Error('Seller ID not available');

//       const { data: existingSeller, error: fetchError } = await supabase
//         .from('sellers')
//         .select('store_name, allows_long')
//         .eq('id', seller.id)
//         .maybeSingle();
//       if (fetchError) throw fetchError;

//       let storeNameToUse = existingSeller?.store_name || prompt('Please enter your store name:', 'Default Store');
//       if (!storeNameToUse) {
//         setLocationMessage('Store name is required to set location.');
//         return;
//       }

//       const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//       const allowsLong = allowLongInput;

//       const { error: rpcError } = await supabase.rpc('set_seller_location', {
//         seller_uuid: seller.id,
//         user_lat: location.lat,
//         user_lon: location.lon,
//         store_name_input: storeNameToUse,
//         allow_long_input: allowsLong,
//       });

//       if (rpcError) throw rpcError;

//       setSellerLocation(location);
//       const newAddress = await fetchAddress(location.lat, location.lon);
//       setSeller((prev) => ({
//         ...prev,
//         latitude: location.lat,
//         longitude: location.lon,
//         store_name: storeNameToUse,
//         allows_long: allowsLong,
//       }));
//       setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error updating location:', err);
//       setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
//     }
//   };

//   const deleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) return;
//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', seller.id);
//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error deleting product:', err);
//       setError(`Error deleting product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOrderClick = (orderId) => {
//     navigate(`/order-details/${orderId}`);
//   };

//   const handleAddProduct = () => {
//     if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//       setError('Please set your store location before adding products.');
//       return;
//     }
//     navigate('/seller/add-product');
//   };

//   useEffect(() => {
//     fetchSellerData();
//     fetchCategories();
//   }, [fetchSellerData, fetchCategories]);

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error && !seller) return <div className="error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="seller-dashboard" style={{ padding: '20px' }}>
//       <h1>Seller Dashboard - {seller?.store_name || 'Unnamed Store'}</h1>
//       {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
//       {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

//       <section className="seller-info" style={{ marginBottom: '20px' }}>
//         <h2><FaStore /> Store Details</h2>
//         <p>Email: <span>{seller?.profiles.email}</span></p>
//         <p>Name: <span>{seller?.profiles.full_name || 'Not set'}</span></p>
//         <p>Phone: <span>{seller?.profiles.phone_number || 'Not set'}</span></p>
//         <p>Location: <span>{address}</span></p>
//         <p>Long-Distance Delivery: <span>{seller?.allows_long ? 'Yes' : 'No'}</span></p>
//         {!process.env.REACT_APP_MAPBOX_TOKEN ? (
//           <p className="error-message" style={{ color: 'red' }}>
//             Error: Mapbox access token is missing.
//           </p>
//         ) : (
//           <MapComponent
//             initialLat={seller?.latitude}
//             initialLon={seller?.longitude}
//             onLocationSelect={handleMapLocationSelect}
//           />
//         )}
//         <button onClick={handleDetectLocation} className="btn-location">
//           Detect Current Location <FaMapMarkerAlt style={{ marginLeft: '5px' }} />
//         </button>
//         {locationMessage && (
//           <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//             {locationMessage}
//           </p>
//         )}
//       </section>

//       <section className="products-section" style={{ marginBottom: '20px' }}>
//         <h2><FaBox /> My Products</h2>
//         <button onClick={handleAddProduct} className="btn-add" style={{ marginBottom: '10px' }}>
//           <FaPlus /> Add Product
//         </button>
//         {products.length === 0 ? (
//           <p>No products found.</p>
//         ) : (
//           <div className="product-list">
//             {products.map((prod) => (
//               <div key={prod.id} className="product-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
//                 <h3>{prod.title}</h3>
//                 <p>Price: ₹{(prod.price || 0).toLocaleString('en-IN')}</p>
//                 <p>Stock: {prod.stock}</p>
//                 {prod.images?.length > 0 && (
//                   prod.images.map((img, i) => (
//                     <img
//                       key={i}
//                       src={img}
//                       alt={`Product ${i}`}
//                       style={{ width: '80px', marginRight: '5px' }}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/80'; }}
//                     />
//                   ))
//                 )}
//                 {prod.variants.length > 0 && (
//                   <div className="variant-list">
//                     <h4>Variants:</h4>
//                     {prod.variants.map((variant) => (
//                       <div key={variant.id} className="variant-item">
//                         <p>
//                           {Object.entries(variant.attributes)
//                             .filter(([_, value]) => value)
//                             .map(([key, value]) => `${key}: ${value}`)
//                             .join(', ')}
//                         </p>
//                         <p>Price: ₹{(variant.price || 0).toLocaleString('en-IN')}</p>
//                         <p>Stock: {variant.stock}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 <Link to={`/product/${prod.id}`} className="btn-view" style={{ marginLeft: '10px' }}>
//                   View
//                 </Link>
//                 <button
//                   onClick={() => deleteProduct(prod.id)}
//                   className="btn-delete"
//                   style={{ marginLeft: '10px', color: 'red' }}
//                 >
//                   <FaTrash /> Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="orders-section" style={{ marginBottom: '20px' }}>
//         <h2><FaTruck /> Buyer Orders</h2>
//         {orders.length === 0 ? (
//           <p>No orders found.</p>
//         ) : (
//           <div className="order-list">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="order-item"
//                 style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
//                 onClick={() => handleOrderClick(order.id)}
//               >
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status || 'N/A'}</p>
//                 {order.order_items?.length > 0 && (
//                   <div>
//                     <h4>Items:</h4>
//                     {order.order_items.map((item, idx) => (
//                       <p key={`${item.product_id}-${idx}`}>
//                         {item.products?.title || 'Unnamed Product'} - Qty: {item.quantity}
//                       </p>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// export default SellerDashboard;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { FaStore, FaBox, FaTruck, FaPlus, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
// import MapComponent from './MapComponent';
// import '../style/SellerDashboard.css';

// function SellerDashboard() {
//   const navigate = useNavigate();
//   const { sellerLocation, setSellerLocation } = useContext(LocationContext);
//   const [seller, setSeller] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const [address, setAddress] = useState('Not set');

//   const fetchCategories = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('id, name, variant_attributes')
//         .order('id');
//       if (error) throw error;
//       setCategories(data || []);
//     } catch (err) {
//       console.error('Error fetching categories:', err);
//       setError('Failed to load categories.');
//     }
//   }, []);

//   const fetchSellerData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('You must be logged in.');
//         navigate('/auth');
//         return;
//       }
//       const sellerId = session.user.id;

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', sellerId)
//         .maybeSingle();
//       if (profileError) throw profileError;
//       if (!profile?.is_seller) {
//         setError('You do not have permission to access seller functions.');
//         navigate('/account');
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('*, profiles(email, full_name, phone_number)')
//         .eq('id', sellerId)
//         .maybeSingle();
//       if (sellerError) throw sellerError;
//       setSeller(sellerData);

//       if (sellerData?.latitude != null && sellerData?.longitude != null) {
//         const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
//         setSellerLocation(newLocation);
//         await fetchAddress(sellerData.latitude, sellerData.longitude);
//       } else {
//         setAddress('Store location not set.');
//       }

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('id, title, price, images, stock, product_variants (id, attributes, price, stock, images)')
//         .eq('seller_id', sellerId)
//         .eq('is_approved', true);
//       if (productsError) throw productsError;
//       const mappedProducts = productsData.map((product) => {
//         const variants = product.product_variants || [];
//         const primaryVariant = variants.length > 0 ? variants[0] : null;
//         return {
//           id: product.id,
//           title: product.title || 'Unnamed Product',
//           price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
//           stock: primaryVariant?.stock ?? product.stock ?? 0,
//           images: primaryVariant?.images?.length > 0
//             ? primaryVariant.images
//             : product.images?.length > 0
//               ? product.images
//               : ['https://dummyimage.com/150'],
//           variants: variants.map(variant => ({
//             id: variant.id,
//             attributes: variant.attributes,
//             price: variant.price,
//             stock: variant.stock,
//             images: variant.images,
//           })),
//         };
//       });
//       setProducts(mappedProducts);

//       const { data: ordersData, error: ordersError } = await supabase
//         .from('orders')
//         .select('*, order_items (product_id, quantity, price, products (title, images))')
//         .eq('seller_id', sellerId);
//       if (ordersError) throw ordersError;
//       setOrders(ordersData || []);
//     } catch (err) {
//       console.error('Error fetching seller data:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate, setSellerLocation]);

//   const fetchAddress = async (lat, lon) => {
//     try {
//       if (lat == null || lon == null) {
//         setAddress('Coordinates unavailable');
//         return 'Coordinates unavailable';
//       }
//       if (!process.env.REACT_APP_MAPBOX_TOKEN) {
//         setAddress('Mapbox token missing');
//         return 'Mapbox token missing';
//       }
//       const response = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
//       );
//       if (!response.ok) {
//         throw new Error(`Mapbox Geocoding failed: ${response.status} - ${response.statusText}`);
//       }
//       const data = await response.json();
//       if (data.features?.[0]?.place_name) {
//         setAddress(data.features[0].place_name);
//         return data.features[0].place_name;
//       } else {
//         setAddress('Address not found');
//         return 'Address not found';
//       }
//     } catch (err) {
//       console.error('Error fetching address:', err);
//       setAddress(`Error: ${err.message}`);
//       return `Error: ${err.message}`;
//     }
//   };

//   const handleDetectLocation = async () => {
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
//           if (!seller?.id) throw new Error('Seller ID not available');

//           const { data: existingSeller, error: fetchError } = await supabase
//             .from('sellers')
//             .select('store_name, allows_long_distance')
//             .eq('id', seller.id)
//             .maybeSingle();
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
//             seller_uuid: seller.id,
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
//           setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
//           fetchSellerData();
//         } catch (err) {
//           console.error('Error updating location:', err);
//           setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
//         }
//       },
//       (geoError) => {
//         console.error('Error detecting location:', geoError);
//         let errorMsg = 'Error detecting location: ';
//         switch (geoError.code) {
//           case geoError.PERMISSION_DENIED:
//             errorMsg += 'Permission denied.';
//             break;
//           case geoError.POSITION_UNAVAILABLE:
//             errorMsg += 'Location unavailable.';
//             break;
//           case geoError.TIMEOUT:
//             errorMsg += 'Request timed out.';
//             break;
//           default:
//             errorMsg += 'Unknown error.';
//         }
//         setLocationMessage(errorMsg);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//     );
//   };

//   const handleMapLocationSelect = async (location) => {
//     try {
//       if (!seller?.id) throw new Error('Seller ID not available');

//       const { data: existingSeller, error: fetchError } = await supabase
//         .from('sellers')
//         .select('store_name, allows_long_distance')
//         .eq('id', seller.id)
//         .maybeSingle();
//       if (fetchError) throw fetchError;

//       let storeNameToUse = existingSeller?.store_name || prompt('Please enter your store name:', 'Default Store');
//       if (!storeNameToUse) {
//         setLocationMessage('Store name is required to set location.');
//         return;
//       }

//       const allowLongInput = window.confirm('Allow long-distance delivery (beyond 40km)?');
//       const allowsLongDistance = allowLongInput;

//       const { error: rpcError } = await supabase.rpc('set_seller_location', {
//         seller_uuid: seller.id,
//         user_lat: location.lat,
//         user_lon: location.lon,
//         store_name_input: storeNameToUse,
//         allow_long_input: allowsLongDistance,
//       });

//       if (rpcError) throw rpcError;

//       setSellerLocation(location);
//       const newAddress = await fetchAddress(location.lat, location.lon);
//       setSeller((prev) => ({
//         ...prev,
//         latitude: location.lat,
//         longitude: location.lon,
//         store_name: storeNameToUse,
//         allows_long_distance: allowsLongDistance,
//       }));
//       setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error updating location:', err);
//       setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
//     }
//   };

//   const deleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) return;
//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', productId)
//         .eq('seller_id', seller.id);
//       if (error) throw error;
//       setMessage('Product deleted successfully!');
//       fetchSellerData();
//     } catch (err) {
//       console.error('Error deleting product:', err);
//       setError(`Error deleting product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOrderClick = (orderId) => {
//     navigate(`/order-details/${orderId}`);
//   };

//   const handleAddProduct = () => {
//     if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
//       setError('Please set your store location before adding products.');
//       return;
//     }
//     navigate('/seller/add-product');
//   };

//   useEffect(() => {
//     fetchSellerData();
//     fetchCategories();
//   }, [fetchSellerData, fetchCategories]);

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error && !seller) return <div className="error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="seller-dashboard" style={{ padding: '20px' }}>
//       <h1>Seller Dashboard - {seller?.store_name || 'Unnamed Store'}</h1>
//       {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
//       {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

//       <section className="seller-info" style={{ marginBottom: '20px' }}>
//         <h2><FaStore /> Store Details</h2>
//         <p>Email: <span>{seller?.profiles.email}</span></p>
//         <p>Name: <span>{seller?.profiles.full_name || 'Not set'}</span></p>
//         <p>Phone: <span>{seller?.profiles.phone_number || 'Not set'}</span></p>
//         <p>Location: <span>{address}</span></p>
//         <p>Long-Distance Delivery: <span>{seller?.allows_long_distance ? 'Yes' : 'No'}</span></p>
//         <MapComponent
//           initialLat={seller?.latitude}
//           initialLon={seller?.longitude}
//           onLocationSelect={handleMapLocationSelect}
//         />
//         <button onClick={handleDetectLocation} className="btn-location">
//           Detect Current Location <FaMapMarkerAlt style={{ marginLeft: '5px' }} />
//         </button>
//         {locationMessage && (
//           <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
//             {locationMessage}
//           </p>
//         )}
//       </section>

//       <section className="products-section" style={{ marginBottom: '20px' }}>
//         <h2><FaBox /> My Products</h2>
//         <button onClick={handleAddProduct} className="btn-add" style={{ marginBottom: '10px' }}>
//           <FaPlus /> Add Product
//         </button>
//         {products.length === 0 ? (
//           <p>No products found.</p>
//         ) : (
//           <div className="product-list">
//             {products.map((prod) => (
//               <div key={prod.id} className="product-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
//                 <h3>{prod.title}</h3>
//                 <p>Price: ₹{(prod.price || 0).toLocaleString('en-IN')}</p>
//                 <p>Stock: {prod.stock}</p>
//                 {prod.images?.length > 0 && (
//                   prod.images.map((img, i) => (
//                     <img
//                       key={i}
//                       src={img}
//                       alt={`Product ${i}`}
//                       style={{ width: '80px', marginRight: '5px' }}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/80'; }}
//                     />
//                   ))
//                 )}
//                 {prod.variants.length > 0 && (
//                   <div className="variant-list">
//                     <h4>Variants:</h4>
//                     {prod.variants.map((variant) => (
//                       <div key={variant.id} className="variant-item">
//                         <p>
//                           {Object.entries(variant.attributes)
//                             .filter(([_, value]) => value)
//                             .map(([key, value]) => `${key}: ${value}`)
//                             .join(', ')}
//                         </p>
//                         <p>Price: ₹{(variant.price || 0).toLocaleString('en-IN')}</p>
//                         <p>Stock: {variant.stock}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//                 <Link to={`/product/${prod.id}`} className="btn-view" style={{ marginLeft: '10px' }}>
//                   View
//                 </Link>
//                 <button
//                   onClick={() => deleteProduct(prod.id)}
//                   className="btn-delete"
//                   style={{ marginLeft: '10px', color: 'red' }}
//                 >
//                   <FaTrash /> Delete
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="orders-section" style={{ marginBottom: '20px' }}>
//         <h2><FaTruck /> Buyer Orders</h2>
//         {orders.length === 0 ? (
//           <p>No orders found.</p>
//         ) : (
//           <div className="order-list">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="order-item"
//                 style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
//                 onClick={() => handleOrderClick(order.id)}
//               >
//                 <h3>Order #{order.id}</h3>
//                 <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
//                 <p>Status: {order.order_status || 'N/A'}</p>
//                 {order.order_items?.length > 0 && (
//                   <div>
//                     <h4>Items:</h4>
//                     {order.order_items.map((item, idx) => (
//                       <p key={`${item.product_id}-${idx}`}>
//                         {item.products?.title || 'Unnamed Product'} - Qty: {item.quantity}
//                       </p>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// export default SellerDashboard;

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { FaStore, FaBox, FaTruck, FaPlus, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import MapComponent from './MapComponent';
import '../style/SellerDashboard.css';

function SellerDashboard() {
  const navigate = useNavigate();
  const { sellerLocation, setSellerLocation } = useContext(LocationContext);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [address, setAddress] = useState('Not set');

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, variant_attributes')
        .order('id');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  }, []);

  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('You must be logged in.');
        navigate('/auth');
        return;
      }
      const sellerId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', sellerId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.is_seller) {
        setError('You do not have permission to access seller functions.');
        navigate('/account');
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*, profiles(email, full_name, phone_number)')
        .eq('id', sellerId)
        .maybeSingle();
      if (sellerError) throw sellerError;
      setSeller(sellerData);

      if (sellerData?.latitude != null && sellerData?.longitude != null) {
        const newLocation = { lat: sellerData.latitude, lon: sellerData.longitude };
        setSellerLocation(newLocation);
        await fetchAddress(sellerData.latitude, sellerData.longitude);
      } else {
        setAddress('Store location not set.');
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, images, stock, product_variants (id, attributes, price, stock, images)')
        .eq('seller_id', sellerId)
        .eq('is_approved', true);
      if (productsError) throw productsError;
      const mappedProducts = productsData.map((product) => {
        const variants = product.product_variants || [];
        const primaryVariant = variants.length > 0 ? variants[0] : null;
        return {
          id: product.id,
          title: product.title || 'Unnamed Product',
          price: primaryVariant?.price > 0 ? primaryVariant.price : product.price || 0,
          stock: primaryVariant?.stock ?? product.stock ?? 0,
          images: primaryVariant?.images?.length > 0
            ? primaryVariant.images
            : product.images?.length > 0
              ? product.images
              : ['https://dummyimage.com/150'],
          variants: variants.map(variant => ({
            id: variant.id,
            attributes: variant.attributes,
            price: variant.price,
            stock: variant.stock,
            images: variant.images,
          })),
        };
      });
      setProducts(mappedProducts);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items (product_id, quantity, price, products (title, images))')
        .eq('seller_id', sellerId);
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate, setSellerLocation]);

  const fetchAddress = async (lat, lon) => {
    try {
      if (lat == null || lon == null) {
        setAddress('Coordinates unavailable');
        return 'Coordinates unavailable';
      }
      // Try Mapbox first
      if (process.env.REACT_APP_MAPBOX_TOKEN) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.features?.[0]?.place_name) {
            setAddress(data.features[0].place_name);
            return data.features[0].place_name;
          }
        }
      }
      // Fallback to Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      if (!response.ok) {
        throw new Error(`Nominatim failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      } else {
        setAddress('Address not found');
        return 'Address not found';
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      setAddress('Error fetching address');
      return 'Error fetching address';
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocationMessage('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const newLocation = { lat, lon };

        try {
          if (!seller?.id) throw new Error('Seller ID not available');

          const { data: existingSeller, error: fetchError } = await supabase
            .from('sellers')
            .select('store_name')
            .eq('id', seller.id)
            .maybeSingle();
          if (fetchError) throw fetchError;

          let storeNameToUse = existingSeller?.store_name || null;

          if (!storeNameToUse) {
            storeNameToUse = prompt('Please enter your store name:', 'Default Store');
            if (!storeNameToUse) {
              setLocationMessage('Store name is required to set location.');
              return;
            }
          }

          const { error: rpcError } = await supabase.rpc('set_seller_location', {
            seller_uuid: seller.id,
            user_lat: lat,
            user_lon: lon,
            store_name_input: storeNameToUse,
          });

          if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw new Error(rpcError.message || 'Failed to update seller location');
          }

          setSellerLocation(newLocation);
          const newAddress = await fetchAddress(lat, lon);
          setSeller((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            store_name: storeNameToUse,
          }));
          setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
          fetchSellerData();
        } catch (err) {
          console.error('Error updating location:', err);
          setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
        }
      },
      (geoError) => {
        console.error('Error detecting location:', geoError);
        let errorMsg = 'Error detecting location: ';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMsg += 'Permission denied.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMsg += 'Location unavailable.';
            break;
          case geoError.TIMEOUT:
            errorMsg += 'Request timed out.';
            break;
          default:
            errorMsg += 'Unknown error.';
        }
        setLocationMessage(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapLocationSelect = async (location) => {
    try {
      if (!seller?.id) throw new Error('Seller ID not available');

      const { data: existingSeller, error: fetchError } = await supabase
        .from('sellers')
        .select('store_name')
        .eq('id', seller.id)
        .maybeSingle();
      if (fetchError) throw fetchError;

      let storeNameToUse = existingSeller?.store_name || prompt('Please enter your store name:', 'Default Store');
      if (!storeNameToUse) {
        setLocationMessage('Store name is required to set location.');
        return;
      }

      const { error: rpcError } = await supabase.rpc('set_seller_location', {
        seller_uuid: seller.id,
        user_lat: location.lat,
        user_lon: location.lon,
        store_name_input: storeNameToUse,
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to update seller location');
      }

      setSellerLocation(location);
      const newAddress = await fetchAddress(location.lat, location.lon);
      setSeller((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lon,
        store_name: storeNameToUse,
      }));
      setLocationMessage(`Location ${sellerLocation ? 'updated' : 'set'} successfully! New address: ${newAddress}`);
      fetchSellerData();
    } catch (err) {
      console.error('Error updating location:', err);
      setLocationMessage(`Error: ${err.message || 'Something went wrong'}`);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', seller.id);
      if (error) throw error;
      setMessage('Product deleted successfully!');
      fetchSellerData();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(`Error deleting product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  const handleAddProduct = () => {
    if (!sellerLocation || !sellerLocation.lat || !sellerLocation.lon) {
      setError('Please set your store location before adding products.');
      return;
    }
    navigate('/seller/add-product');
  };

  useEffect(() => {
    fetchSellerData();
    fetchCategories();
  }, [fetchSellerData, fetchCategories]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error && !seller) return <div className="error" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="seller-dashboard" style={{ padding: '20px' }}>
      <h1>Seller Dashboard - {seller?.store_name || 'Unnamed Store'}</h1>
      {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

      <section className="seller-info" style={{ marginBottom: '20px' }}>
        <h2><FaStore /> Store Details</h2>
        <p>Email: <span>{seller?.profiles.email}</span></p>
        <p>Name: <span>{seller?.profiles.full_name || 'Not set'}</span></p>
        <p>Phone: <span>{seller?.profiles.phone_number || 'Not set'}</span></p>
        <p>Location: <span>{address}</span></p>
        <MapComponent
          initialLat={seller?.latitude}
          initialLon={seller?.longitude}
          onLocationSelect={handleMapLocationSelect}
        />
        <button onClick={handleDetectLocation} className="btn-location">
          Detect Current Location <FaMapMarkerAlt style={{ marginLeft: '5px' }} />
        </button>
        {locationMessage && (
          <p className={`location-message ${locationMessage.includes('Error') ? 'error' : 'success'}`}>
            {locationMessage}
          </p>
        )}
      </section>

      <section className="products-section" style={{ marginBottom: '20px' }}>
        <h2><FaBox /> My Products</h2>
        <button onClick={handleAddProduct} className="btn-add" style={{ marginBottom: '10px' }}>
          <FaPlus /> Add Product
        </button>
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="product-list">
            {products.map((prod) => (
              <div key={prod.id} className="product-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                <h3>{prod.title}</h3>
                <p>Price: ₹{(prod.price || 0).toLocaleString('en-IN')}</p>
                <p>Stock: {prod.stock}</p>
                {prod.images?.length > 0 && (
                  prod.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Product ${i}`}
                      style={{ width: '80px', marginRight: '5px' }}
                      onError={(e) => { e.target.src = 'https://dummyimage.com/80'; }}
                    />
                  ))
                )}
                {prod.variants.length > 0 && (
                  <div className="variant-list">
                    <h4>Variants:</h4>
                    {prod.variants.map((variant) => (
                      <div key={variant.id} className="variant-item">
                        <p>
                          {Object.entries(variant.attributes)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                        <p>Price: ₹{(variant.price || 0).toLocaleString('en-IN')}</p>
                        <p>Stock: {variant.stock}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link to={`/product/${prod.id}`} className="btn-view" style={{ marginLeft: '10px' }}>
                  View
                </Link>
                <button
                  onClick={() => deleteProduct(prod.id)}
                  className="btn-delete"
                  style={{ marginLeft: '10px', color: 'red' }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="orders-section" style={{ marginBottom: '20px' }}>
        <h2><FaTruck /> Buyer Orders</h2>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className="order-item"
                style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
                onClick={() => handleOrderClick(order.id)}
              >
                <h3>Order #{order.id}</h3>
                <p>Total: ₹{(order.total || 0).toLocaleString('en-IN')}</p>
                <p>Status: {order.order_status || 'N/A'}</p>
                {order.order_items?.length > 0 && (
                  <div>
                    <h4>Items:</h4>
                    {order.order_items.map((item, idx) => (
                      <p key={`${item.product_id}-${idx}`}>
                        {item.products?.title || 'Unnamed Product'} - Qty: {item.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SellerDashboard;