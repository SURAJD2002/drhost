


// // src/components/Checkout.js

// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);

//   const navigate = useNavigate();

//   // ----------------------------------
//   // Initial effect: load cart, fetch products, geolocation
//   // ----------------------------------
//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);
//     detectUserLocation();
//   }, []);

//   // ----------------------------------
//   // Fetch products for the cart
//   // ----------------------------------
//   const fetchCartProducts = useCallback(async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = cart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );

//       if (error) throw error;
//       if (data) {
//         const validProducts = data.map((product) => {
//           // Find matching cart item
//           const storedItem = cart.find((item) => item.id === product.id);
//           if (storedItem && storedItem.selectedVariant) {
//             // Use variant details from cart
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images:
//                 storedItem.selectedVariant.images?.length
//                   ? storedItem.selectedVariant.images
//                   : product.images,
//             };
//           }
//           // Fallback: use product's default or first variant
//           const variantWithImages = product.product_variants?.find(
//             (v) => Array.isArray(v.images) && v.images.length > 0
//           );
//           const finalImages =
//             product.images?.length
//               ? product.images
//               : variantWithImages?.images || [
//                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
//                 ];
//           const productPrice =
//             product.price !== null && product.price !== undefined
//               ? product.price
//               : variantWithImages?.price || 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//           };
//         });
//         setProducts(validProducts);
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ----------------------------------
//   // Attempt geolocation
//   // ----------------------------------
//   const detectUserLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setLocation({ lat: 12.9753, lon: 77.591 });
//           setAddress('Bangalore, Karnataka, India');
//           setError('Unable to fully detect location; using default Bengaluru location.');
//         },
//         { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       setAddress('Bangalore, Karnataka, India');
//     }
//   };

//   // ----------------------------------
//   // Reverse geocode using OpenStreetMap
//   // ----------------------------------
//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) return data.display_name;
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   // ----------------------------------
//   // Compute total cost
//   // ----------------------------------
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   // ----------------------------------
//   // Group cart items by seller
//   // ----------------------------------
//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;
//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: prod.price || 0,
//       });
//     }
//     return itemsBySeller;
//   }

//   // ----------------------------------
//   // Place Orders (one per seller)
//   // ----------------------------------
//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     // For each seller
//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: sessionUserId,
//           seller_id: sellerId,
//           total: subTotal,
//           order_status: 'pending',
//           payment_method: paymentMethod,
//           shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//           shipping_address: finalAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .select();

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await supabase
//         .from('order_items')
//         .insert(
//           sellerItems.map((item) => ({
//             order_id: insertedOrder.id,
//             product_id: item.product_id,
//             quantity: item.quantity,
//             price: item.price,
//           }))
//         );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
//       );
//     }
//   }

//   // ----------------------------------
//   // Simulate payment
//   // ----------------------------------
//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   // ----------------------------------
//   // Handle checkout
//   // ----------------------------------
//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = location || { lat: 12.9753, lon: 77.591 };
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       // Clear cart
//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ----------------------------------
//   // Render
//   // ----------------------------------
//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//         <p style={{ color: '#666' }}>
//           Your orders have been placed successfully. Redirecting to your account...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           {/* Display Items */}
//           <div className="checkout-items">
//             {/* FIX: Use (product, index) as the map to ensure unique keys */}
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div
//                   key={`${product.id}-${index}`} // <-- ensure uniqueness by appending index
//                   className="checkout-item"
//                   style={{
//                     border: '1px solid #ccc',
//                     borderRadius: '8px',
//                     padding: '10px',
//                     margin: '10px',
//                   }}
//                 >
//                   <img
//                     src={
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     style={{
//                       width: '150px',
//                       height: '150px',
//                       objectFit: 'cover',
//                       borderRadius: '5px',
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                     <p style={{ color: '#000', margin: '5px 0' }}>
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p style={{ color: '#666', margin: '5px 0' }}>Quantity: {quantity}</p>
//                     <p style={{ color: '#666', margin: '5px 0' }}>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Checkout Details */}
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary (All Sellers)</h2>
//             <p style={{ color: '#666' }}>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Lat {location.lat.toFixed(4)}, Lon{' '}
//                 {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               style={{
//                 width: '100%',
//                 padding: '8px',
//                 borderRadius: '5px',
//                 border: '1px solid #007bff',
//                 marginBottom: '10px',
//               }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{
//                 padding: '8px',
//                 borderRadius: '5px',
//                 border: '1px solid #007bff',
//                 backgroundColor: 'white',
//                 color: '#666',
//               }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button
//               onClick={handleCheckout}
//               style={{
//                 backgroundColor: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 20px',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//                 marginTop: '10px',
//               }}
//               disabled={loading}
//             >
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}

//       {/* Footer */}
//       <div
//         className="footer"
//         style={{
//           backgroundColor: '#f8f9fa',
//           padding: '10px',
//           textAlign: 'center',
//           color: '#666',
//           marginTop: '20px',
//         }}
//       >
//         <div
//           className="footer-icons"
//           style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
//         >
//           <span
//             className="icon-circle"
//             style={{
//               backgroundColor: '#007bff',
//               borderRadius: '50%',
//               width: '40px',
//               height: '40px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//             }}
//           >
//             🏠
//           </span>
//           <span
//             className="icon-circle"
//             style={{
//               backgroundColor: '#007bff',
//               borderRadius: '50%',
//               width: '40px',
//               height: '40px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//             }}
//           >
//             🛒
//           </span>
//         </div>
//         <p style={{ color: '#007bff' }}>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Checkout;

// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App'; // Import LocationContext
// import '../style/Checkout.css';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//     Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext); // Use buyerLocation from context
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);

//   const navigate = useNavigate();

//   // Set location from context
//   useEffect(() => {
//     if (buyerLocation) {
//       setLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }
//   }, [buyerLocation]);

//   // Fetch products when cartItems and location are available
//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);

//     if (storedCart.length === 0 || !location) {
//       setLoading(false);
//       return;
//     }
//     fetchCartProducts(storedCart);
//   }, [location, fetchCartProducts]);

//   // Fetch products for the cart with 40 km radius check
//   const fetchCartProducts = useCallback(async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = cart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );

//       if (productError) throw productError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = productData
//         .map((product) => {
//           const storedItem = cart.find((item) => item.id === product.id);
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           // Apply 40 km radius check
//           if (!seller || calculateDistance(location, seller) > 40) {
//             return null; // Exclude if beyond 40 km
//           }

//           if (storedItem && storedItem.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images:
//                 storedItem.selectedVariant.images?.length
//                   ? storedItem.selectedVariant.images
//                   : product.images,
//             };
//           }

//           const variantWithImages = product.product_variants?.find(
//             (v) => Array.isArray(v.images) && v.images.length > 0
//           );
//           const finalImages =
//             product.images?.length
//               ? product.images
//               : variantWithImages?.images || [
//                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
//                 ];
//           const productPrice =
//             product.price !== null && product.price !== undefined
//               ? product.price
//               : variantWithImages?.price || 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//           };
//         })
//         .filter((p) => p !== null); // Remove excluded products

//       setProducts(validProducts);
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [location]);

//   // Reverse geocode using OpenStreetMap
//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   // Compute total cost
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   // Group cart items by seller
//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;
//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: prod.price || 0,
//       });
//     }
//     return itemsBySeller;
//   }

//   // Place Orders (one per seller)
//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       const { data: orderData, error: orderError } = await retryRequest(() =>
//         supabase
//           .from('orders')
//           .insert({
//             user_id: sessionUserId,
//             seller_id: sellerId,
//             total: subTotal,
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .select()
//       );

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await retryRequest(() =>
//         supabase
//           .from('order_items')
//           .insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//       );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
//       );
//     }
//   }

//   // Simulate payment
//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   // Handle checkout
//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = location || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       // Clear cart
//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Render
//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           {/* Display Items */}
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.name || 'Unnamed Product'}</h3>
//                     <p>
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Checkout Details */}
//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {location && address ? (
//               <p>
//                 Detected Address: {address} (Lat {location.lat.toFixed(4)}, Lon{' '}
//                 {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}

//       {/* Footer */}
//       <div className="footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Checkout;


// // src/components/Checkout.js
// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);

//   const navigate = useNavigate();

//   useEffect(() => {
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }
//   }, [buyerLocation, setError]);

//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);

//     if (storedCart.length === 0 || !userLocation) {
//       return;
//     }
//     fetchCartProducts(storedCart);
//   }, [userLocation, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;
//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: prod.price || 0,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       const { data: orderData, error: orderError } = await retryRequest(() =>
//         supabase
//           .from('orders')
//           .insert({
//             user_id: sessionUserId,
//             seller_id: sellerId,
//             total: subTotal,
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .select()
//       );

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await retryRequest(() =>
//         supabase
//           .from('order_items')
//           .insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//       );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
//       );
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.name || 'Unnamed Product'}</h3>
//                     <p>
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}

//       <div className="footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p>Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Checkout;




// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);

//   const navigate = useNavigate();

//   useEffect(() => {
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }
//   }, [buyerLocation, setError]);

//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);

//     if (storedCart.length === 0 || !userLocation) {
//       return;
//     }
//     fetchCartProducts(storedCart);
//   }, [userLocation, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;
//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: prod.price || 0,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       const { data: orderData, error: orderError } = await retryRequest(() =>
//         supabase
//           .from('orders')
//           .insert({
//             user_id: sessionUserId,
//             seller_id: sellerId,
//             total: subTotal,
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .select()
//       );

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await retryRequest(() =>
//         supabase
//           .from('order_items')
//           .insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//       );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
//       );
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'} // Updated alt for accessibility
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3> {/* Fixed product name logic */}
//                     <p>
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}
//       <Footer /> {/* Use Footer component instead of inline footer */}
//     </div>
//   );
// }

// export default Checkout;




// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, userLocation, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       const variant = prod.selectedVariant || prod.product_variants?.find(v => v.id === variantId);
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variantId || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       const { data: orderData, error: orderError } = await retryRequest(() =>
//         supabase
//           .from('orders')
//           .insert({
//             user_id: sessionUserId,
//             seller_id: sellerId,
//             total: subTotal,
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .select()
//       );

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await retryRequest(() =>
//         supabase
//           .from('order_items')
//           .insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//       );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
//       );
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, userLocation, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       const variant = prod.selectedVariant || prod.product_variants?.find(v => v.id === variantId);
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variantId || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       const sellerItems = itemsBySeller[sellerId];
//       const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//       // Calculate estimated delivery (3 to 24 hours from now)
//       const minDeliveryHours = 3;
//       const maxDeliveryHours = 24;
//       const deliveryOffset = Math.floor(Math.random() * (maxDeliveryHours - minDeliveryHours + 1)) + minDeliveryHours;
//       const estimatedDelivery = new Date();
//       estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//       const { data: orderData, error: orderError } = await retryRequest(() =>
//         supabase
//           .from('orders')
//           .insert({
//             user_id: sessionUserId,
//             seller_id: sellerId,
//             total: subTotal,
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//             shipping_address: finalAddress,
//             estimated_delivery: estimatedDelivery.toISOString(), // Store estimated delivery time
//           })
//           .select()
//       );

//       if (orderError) throw orderError;
//       const insertedOrder = orderData[0];

//       const { error: itemsError } = await retryRequest(() =>
//         supabase
//           .from('order_items')
//           .insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//       );
//       if (itemsError) throw itemsError;

//       console.log(
//         `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//       );
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Seller ID: <strong>{product.seller_id}</strong>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Orders'}
//             </button>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts]); // Removed userLocation from dependencies

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find(v => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const minDeliveryHours = 3;
//         const maxDeliveryHours = 24;
//         const deliveryOffset = Math.floor(Math.random() * (maxDeliveryHours - minDeliveryHours + 1)) + minDeliveryHours;
//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       // Clear cart only after orders are successfully placed
//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from './ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) - Consistent with App.js
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find(v => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const minDeliveryHours = 3;
//         const maxDeliveryHours = 24;
//         const deliveryOffset = Math.floor(Math.random() * (maxDeliveryHours - minDeliveryHours + 1)) + minDeliveryHours;
//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//   }

//   const simulatePayment = () => {
//     return true; // For testing, always succeed
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       // Clear cart only after orders are successfully placed
//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button onClick={handleApplyEMI}>
//                 Apply for EMI (No Credit Card Needed)
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={productId}
//               productName={productName}
//               productPrice={productPrice}
//               sellerId={sellerId}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from './ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru)
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };

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

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [orderIds, setOrderIds] = useState([]);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress('Bangalore, Karnataka, India');
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       return data?.display_name || null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find(v => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', sellerId)
//           .single();
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : 40;
//         const baseHours = distance <= 40 ? 3 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);

//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = () => {
//     const success = Math.random() > 0.2; // 80% success rate for testing
//     if (!success) throw new Error('Payment failed. Please try again.');
//     return true;
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Please provide a valid shipping address (minimum 10 characters).');
//     }
//     const hasCityOrPin = address.match(/(city|state|pin|postal)\s*:\s*\w+/i);
//     if (!hasCityOrPin) {
//       throw new Error('Shipping address should include city and postal code.');
//     }
//     return true;
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';
//       validateAddress(finalAddress);

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderIds(newOrderIds);
//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account', { state: { newOrderIds } });
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setCartItems(originalCart);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI can only be applied for products from a single seller. Please adjust your cart.');
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => setManualAddress(e.target.value)}
//               placeholder="Enter your shipping address (include city and postal code)..."
//               rows="3"
//             />

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button onClick={handleApplyEMI}>
//                 Apply for EMI (No Credit Card Needed)
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={productId}
//               productName={productName}
//               productPrice={productPrice}
//               sellerId={sellerId}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';

// // Default location (Bengaluru) with postal code
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

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

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [orderIds, setOrderIds] = useState([]);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (!data?.address) return null;

//       // Extract address components
//       const city =
//         data.address.city ||
//         data.address.town ||
//         data.address.village ||
//         data.address.county ||
//         data.address.state ||
//         'Unknown City';
//       const postalCode = data.address.postcode || '560001'; // Fallback postal code
//       const state = data.address.state || '';
//       const country = data.address.country || 'India';
//       const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';

//       // Format the address
//       const formattedAddress = [road, city, state, postalCode, country]
//         .filter(Boolean)
//         .join(', ');
//       return formattedAddress || data.display_name || DEFAULT_ADDRESS;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return DEFAULT_ADDRESS;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find(v => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', sellerId)
//           .single();
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : 40;
//         const baseHours = distance <= 40 ? 3 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);

//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = () => {
//     const success = Math.random() > 0.2; // 80% success rate for testing
//     if (!success) throw new Error('Payment failed. Please try again.');
//     return true;
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Please provide a valid shipping address (minimum 10 characters).');
//     }
//     // Split address into components (comma or space separated)
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least two components (e.g., street and city).');
//     }
//     // Check for a city-like component (any word that could be a city name)
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     // Check for a postal code-like component (3-10 digits)
//     const hasPostalCode = components.some((comp) => comp.match(/\b\d{3,10}\b/));
//     if (!hasCity || !hasPostalCode) {
//       throw new Error('Shipping address must include a city (e.g., Bangalore) and a postal code (e.g., 560001).');
//     }
//     return true;
//   };

//   const validateManualAddress = (address) => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderIds(newOrderIds);
//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account', { state: { newOrderIds } });
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setCartItems(originalCart);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI can only be applied for products from a single seller. Please adjust your cart.');
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, 560001, India)"
//               rows="3"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button onClick={handleApplyEMI}>
//                 Apply for EMI (No Credit Card Needed)
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={productId}
//               productName={productName}
//               productPrice={productPrice}
//               sellerId={sellerId}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async'; // Added

// // Default location (Bengaluru) with postal code
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371;
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

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [orderIds, setOrderIds] = useState([]);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (!data?.address) return null;

//       const city =
//         data.address.city ||
//         data.address.town ||
//         data.address.village ||
//         data.address.county ||
//         data.address.state ||
//         'Unknown City';
//       const postalCode = data.address.postcode || '560001';
//       const state = data.address.state || '';
//       const country = data.address.country || 'India';
//       const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';

//       const formattedAddress = [road, city, state, postalCode, country]
//         .filter(Boolean)
//         .join(', ');
//       return formattedAddress || data.display_name || DEFAULT_ADDRESS;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return DEFAULT_ADDRESS;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find(v => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', sellerId)
//           .single();
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : 40;
//         const baseHours = distance <= 40 ? 3 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);

//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = () => {
//     const success = Math.random() > 0.2;
//     if (!success) throw new Error('Payment failed. Please try again.');
//     return true;
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Please provide a valid shipping address (minimum 10 characters).');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least two components (e.g., street and city).');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     const hasPostalCode = components.some((comp) => comp.match(/\b\d{3,10}\b/));
//     if (!hasCity || !hasPostalCode) {
//       throw new Error('Shipping address must include a city (e.g., Bangalore) and a postal code (e.g., 560001).');
//     }
//     return true;
//   };

//   const validateManualAddress = (address) => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderIds(newOrderIds);
//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account', { state: { newOrderIds } });
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setCartItems(originalCart);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI can only be applied for products from a single seller. Please adjust your cart.');
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta
//             name="description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta
//             property="og:image"
//             content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//           />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "WebPage",
//               name: "Order Confirmed - Markeet",
//               description: "Your order has been successfully placed on Markeet.",
//               url: pageUrl,
//             })}
//           </script>
//         </Helmet>
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
//         />
//         <meta
//           property="og:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             name: "Checkout - Markeet",
//             description: "Complete your purchase on Markeet.",
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} checkout image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, 560001, India)"
//               rows="3"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button onClick={handleApplyEMI}>
//                 Apply for EMI (No Credit Card Needed)
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={productId}
//               productName={productName}
//               productPrice={productPrice}
//               sellerId={sellerId}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Default location (Bengaluru) with postal code
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
//   const R = 6371;
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

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) {
//         return;
//       }
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setError('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, setError, fetchCartProducts]);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (!data?.address) return null;

//       const city =
//         data.address.city ||
//         data.address.town ||
//         data.address.village ||
//         data.address.county ||
//         data.address.state ||
//         'Unknown City';
//       const postalCode = data.address.postcode || '560001';
//       const state = data.address.state || '';
//       const country = data.address.country || 'India';
//       const road = data.address.road || data.address.neighbourhood || data.address.suburb || '';

//       const formattedAddress = [road, city, state, postalCode, country]
//         .filter(Boolean)
//         .join(', ');
//       return formattedAddress || data.display_name || DEFAULT_ADDRESS;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return DEFAULT_ADDRESS;
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.id);
//     const quantity = cartItem?.quantity || 1;
//     const variant = product.selectedVariant;
//     const price = variant?.price || product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (let item of cartItems) {
//       const prod = products.find((p) => p.id === item.id);
//       if (!prod) continue;

//       const variantId = item.selectedVariant?.id;
//       let variant;
//       if (variantId && prod.product_variants) {
//         variant = prod.selectedVariant || prod.product_variants.find((v) => v.id === variantId);
//       } else {
//         variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
//       }
//       const price = variant?.price || prod.price || 0;

//       const sid = prod.seller_id;
//       if (!itemsBySeller[sid]) {
//         itemsBySeller[sid] = [];
//       }
//       itemsBySeller[sid].push({
//         product_id: item.id,
//         variant_id: variant?.id || null,
//         quantity: item.quantity || 1,
//         price: price,
//       });
//     }
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (let sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', sellerId)
//           .single();
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : 40;
//         const baseHours = distance <= 40 ? 3 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);

//         const sellerItems = itemsBySeller[sellerId];
//         const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

//         const estimatedDelivery = new Date();
//         estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

//         const { data: orderData, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               user_id: sessionUserId,
//               seller_id: sellerId,
//               total: subTotal,
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//         );

//         if (orderError) throw orderError;
//         const insertedOrder = orderData[0];
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase
//             .from('order_items')
//             .insert(
//               sellerItems.map((item) => ({
//                 order_id: insertedOrder.id,
//                 product_id: item.product_id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: item.price,
//               }))
//             )
//         );
//         if (itemsError) throw itemsError;

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(errors.join('; '));
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = () => {
//     const success = Math.random() > 0.2;
//     if (!success) throw new Error('Payment failed. Please try again.');
//     return true;
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Please provide a valid shipping address (minimum 10 characters).');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least two components (e.g., street and city).');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     const hasPostalCode = components.some((comp) => comp.match(/\b\d{3,10}\b/));
//     if (!hasCity || !hasPostalCode) {
//       throw new Error('Shipping address must include a city (e.g., Bangalore) and a postal code (e.g., 560001).');
//     }
//     return true;
//   };

//   const validateManualAddress = (address) => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       if (session?.user) {
//         await supabase
//           .from('cart')
//           .delete()
//           .eq('user_id', session.user.id);
//       }

//       setOrderConfirmed(true);
//       setError(null);

//       navigate('/account', { state: { newOrderIds } });
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setCartItems(originalCart);
//       setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI can only be applied for products from a single seller. Please adjust your cart.');
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta
//             name="description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta
//             property="og:image"
//             content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//           />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet. Check your account for details."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "WebPage",
//               name: "Order Confirmed - Markeet",
//               description: "Your order has been successfully placed on Markeet.",
//               url: pageUrl,
//             })}
//           </script>
//         </Helmet>
//         <h1>Order Confirmed!</h1>
//         <p>Your orders have been placed successfully. Redirecting to your account...</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
//         />
//         <meta
//           property="og:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             name: "Checkout - Markeet",
//             description: "Complete your purchase on Markeet.",
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.id);
//               const quantity = cartItem?.quantity || 1;
//               const variant = product.selectedVariant;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val)
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={`${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={
//                       (variant?.images?.[0] || product.images?.[0]) ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.title || product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                   />
//                   <div className="checkout-item-details">
//                     <h3>{product.title || product.name || 'Unnamed Product'}</h3>
//                     {variantAttributes && (
//                       <p className="variant-details">Variant: {variantAttributes}</p>
//                     )}
//                     <p>
//                       ₹
//                       {(variant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2>Order Summary (All Sellers)</h2>
//             <p>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3>Shipping Address</h3>
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, 560001, India)"
//               rows="3"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3>Payment Method</h3>
//             <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button onClick={handleApplyEMI}>
//                 Apply for EMI (No Credit Card Needed)
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button onClick={handleCheckout} disabled={loading}>
//                 {loading ? 'Processing...' : 'Place Orders'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={productId}
//               productName={productName}
//               productPrice={productPrice}
//               sellerId={sellerId}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;




import React, { useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
import ApplyEMI from '../components/ApplyEMI';
import '../style/Checkout.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';

// Default location (Bengaluru) with postal code
const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// Utility to debounce a function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon) return null;
  const R = 6371;
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

async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function Checkout() {
  const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
    useFetchCartProducts(userLocation);
  const navigate = useNavigate();

  // Debounced address fetch from Account.js
  const debouncedFetchAddress = useCallback(
    debounce(async (lat, lon) => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'FreshCart/1.0' } }
        );
        if (!resp.ok) throw new Error('Failed to fetch address');
        const data = await resp.json();
        const newAddress = data.display_name || DEFAULT_ADDRESS;
        setAddress(newAddress);
        setManualAddress(newAddress); // Auto-populate manual address
        setLocationMessage('Address fetched successfully.');
      } catch (e) {
        console.error('fetchAddress error', e);
        setAddress(DEFAULT_ADDRESS);
        setManualAddress(DEFAULT_ADDRESS);
        setLocationMessage('Error fetching address. Please enter manually.');
      }
    }, 500),
    []
  );

  // Detect user location (adapted from Account.js)
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
      setShowManualLocation(true);
      return;
    }
    setLocationMessage('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const newLoc = { lat, lon };
        setUserLocation(newLoc);
        setBuyerLocation(newLoc); // Update LocationContext
        debouncedFetchAddress(lat, lon);
        setLocationMessage('Location detected successfully.');
      },
      (err) => {
        setLocationMessage('Location permission denied or timed out. Please enter manually.');
        setShowManualLocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setBuyerLocation, debouncedFetchAddress]);

  // Manual location update
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
    const newLoc = { lat, lon };
    setUserLocation(newLoc);
    setBuyerLocation(newLoc);
    debouncedFetchAddress(lat, lon);
    setShowManualLocation(false);
    setManualLat('');
    setManualLon('');
    setLocationMessage('Manual location set successfully.');
  }, [manualLat, manualLon, setBuyerLocation, debouncedFetchAddress]);

  useEffect(() => {
    const initializeCart = async () => {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);

      if (storedCart.length === 0 || !userLocation) {
        return;
      }
      fetchCartProducts(storedCart);
    };

    if (buyerLocation) {
      setUserLocation(buyerLocation);
      debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setAddress(DEFAULT_ADDRESS);
      setManualAddress(DEFAULT_ADDRESS);
      setError('Unable to detect location; using default Bengaluru location.');
      // Auto-detect location on mount
      handleDetectLocation();
    }

    initializeCart();
  }, [buyerLocation, userLocation, setError, fetchCartProducts, debouncedFetchAddress, handleDetectLocation]);

  const total = products.reduce((sum, product) => {
    const cartItem = cartItems.find((item) => item.id === product.id);
    const quantity = cartItem?.quantity || 1;
    const variant = product.selectedVariant;
    const price = variant?.price || product.price || 0;
    return sum + price * quantity;
  }, 0);

  function groupCartItemsBySeller() {
    const itemsBySeller = {};
    for (let item of cartItems) {
      const prod = products.find((p) => p.id === item.id);
      if (!prod) continue;

      const variantId = item.selectedVariant?.id;
      let variant;
      if (variantId && prod.product_variants) {
        variant = prod.selectedVariant || prod.product_variants.find((v) => v.id === variantId);
      } else {
        variant = prod.selectedVariant || (prod.product_variants?.[0] || null);
      }
      const price = variant?.price || prod.price || 0;

      const sid = prod.seller_id;
      if (!itemsBySeller[sid]) {
        itemsBySeller[sid] = [];
      }
      itemsBySeller[sid].push({
        product_id: item.id,
        variant_id: variant?.id || null,
        quantity: item.quantity || 1,
        price: price,
      });
    }
    return itemsBySeller;
  }

  async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
    const itemsBySeller = groupCartItemsBySeller();
    const errors = [];
    const newOrderIds = [];

    for (let sellerId of Object.keys(itemsBySeller)) {
      try {
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('latitude, longitude')
          .eq('id', sellerId)
          .single();
        const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
        const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : 40;
        const baseHours = distance <= 40 ? 3 : 24;
        const deliveryOffset = baseHours + Math.floor(Math.random() * 12);

        const sellerItems = itemsBySeller[sellerId];
        const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const estimatedDelivery = new Date();
        estimatedDelivery.setHours(estimatedDelivery.getHours() + deliveryOffset);

        const { data: orderData, error: orderError } = await retryRequest(() =>
          supabase
            .from('orders')
            .insert({
              user_id: sessionUserId,
              seller_id: sellerId,
              total: subTotal,
              order_status: 'pending',
              payment_method: paymentMethod,
              shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
              shipping_address: finalAddress,
              estimated_delivery: estimatedDelivery.toISOString(),
            })
            .select()
        );

        if (orderError) throw orderError;
        const insertedOrder = orderData[0];
        newOrderIds.push(insertedOrder.id);

        const { error: itemsError } = await retryRequest(() =>
          supabase
            .from('order_items')
            .insert(
              sellerItems.map((item) => ({
                order_id: insertedOrder.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price,
              }))
            )
        );
        if (itemsError) throw itemsError;

        console.log(
          `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
        );
      } catch (error) {
        errors.push(`Failed to place order for seller ${sellerId}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    return newOrderIds;
  }

  const simulatePayment = async () => {
    // TODO: Replace with real payment gateway
    return true; // Always succeed for testing
  };

  const validateAddress = (address) => {
    if (!address || address.trim().length < 5) {
      throw new Error('Please provide a valid shipping address (minimum 5 characters).');
    }
    const components = address.split(/,\s*|\s+/).filter(Boolean);
    if (components.length < 1) {
      throw new Error('Shipping address must include at least one component (e.g., city).');
    }
    const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
    if (!hasCity) {
      throw new Error('Shipping address must include a city (e.g., Bangalore).');
    }
    return true;
  };

  const validateManualAddress = (address) => {
    try {
      validateAddress(address);
      setAddressError('');
      return true;
    } catch (error) {
      setAddressError(error.message);
      return false;
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    const originalCart = [...cartItems];
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Please log in to complete your purchase.');
        setLoading(false);
        navigate('/auth');
        return;
      }

      const shippingLocation = userLocation || DEFAULT_LOCATION;
      const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
      validateAddress(finalAddress);

      const paymentSuccess = await retryRequest(simulatePayment, 3, 1000);
      if (!paymentSuccess) {
        throw new Error('Payment processing failed. Please try again.');
      }

      const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

      setCartItems([]);
      setProducts([]);
      localStorage.setItem('cart', JSON.stringify([]));
      if (session?.user) {
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', session.user.id);
      }

      setOrderConfirmed(true);
      setError(null);

      setTimeout(() => {
        navigate('/account', { state: { newOrderIds } });
      }, 2000);
    } catch (error) {
      console.error('Error during checkout:', error);
      setCartItems(originalCart);
      setError(`Checkout failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEMI = () => {
    const itemsBySeller = groupCartItemsBySeller();
    if (Object.keys(itemsBySeller).length > 1) {
      setError('EMI can only be applied for products from a single seller. Please adjust your cart.');
      return;
    }
    if (products.length === 0) {
      setError('No products in cart to apply for EMI.');
      return;
    }
    setShowEMIModal(true);
  };

  const pageUrl = 'https://www.markeet.com/checkout';

  if (loading) return <div className="checkout-loading-spinner">Processing...</div>;
  if (error) return <div className="checkout-error">{error}</div>;

  if (orderConfirmed) {
    return (
      <div className="checkout-success">
        <Helmet>
          <title>Order Confirmed - Markeet</title>
          <meta
            name="description"
            content="Your order has been successfully placed on Markeet. Check your account for details."
          />
          <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={pageUrl} />
          <meta property="og:title" content="Order Confirmed - Markeet" />
          <meta
            property="og:description"
            content="Your order has been successfully placed on Markeet. Check your account for details."
          />
          <meta
            property="og:image"
            content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
          />
          <meta property="og:url" content={pageUrl} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Order Confirmed - Markeet" />
          <meta
            name="twitter:description"
            content="Your order has been successfully placed on Markeet. Check your account for details."
          />
          <meta
            name="twitter:image"
            content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
          />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Order Confirmed - Markeet",
              description: "Your order has been successfully placed on Markeet.",
              url: pageUrl,
            })}
          </script>
        </Helmet>
        <h1>Order Confirmed!</h1>
        <p>Your orders have been placed successfully. Redirecting to your account...</p>
      </div>
    );
  }

  const firstProduct = products[0] || {};
  const productId = firstProduct.id || null;
  const productName = firstProduct.title || firstProduct.name || 'Unnamed Product';
  const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
  const sellerId = firstProduct.seller_id || null;

  return (
    <div className="checkout">
      <Helmet>
        <title>Checkout - Markeet</title>
        <meta
          name="description"
          content="Complete your purchase on Markeet. Enter shipping details and choose payment options for electronics, appliances, fashion, and more."
        />
        <meta
          name="keywords"
          content="checkout, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Checkout - Markeet" />
        <meta
          property="og:description"
          content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
        />
        <meta
          property="og:image"
          content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Checkout - Markeet" />
        <meta
          name="twitter:description"
          content="Complete your purchase on Markeet. Enter shipping details and choose payment options."
        />
        <meta
          name="twitter:image"
          content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Checkout - Markeet",
            description: "Complete your purchase on Markeet.",
            url: pageUrl,
          })}
        </script>
      </Helmet>
      <h1>FreshCart Checkout</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="checkout-items">
            {products.map((product, index) => {
              const cartItem = cartItems.find((item) => item.id === product.id);
              const quantity = cartItem?.quantity || 1;
              const variant = product.selectedVariant;
              const variantAttributes = variant?.attributes
                ? Object.entries(variant.attributes)
                    .filter(([key, val]) => val)
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ')
                : null;

              return (
                <div key={`${product.id}-${index}`} className="checkout-item">
                  <img
                    src={
                      (variant?.images?.[0] || product.images?.[0]) ||
                      'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                    }
                    alt={product.title || product.name || 'Product'}
                    onError={(e) => {
                      e.target.src =
                        'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    }}
                  />
                  <div className="checkout-item-details">
                    <h3>{product.title || product.name || 'Unnamed Product'}</h3>
                    {variantAttributes && (
                      <p className="variant-details">Variant: {variantAttributes}</p>
                    )}
                    <p>
                      ₹
                      {(variant?.price || product.price).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>Quantity: {quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="checkout-details">
            <h2>Order Summary (All Sellers)</h2>
            <p>
              Total: ₹
              {total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <h3>Shipping Address</h3>
            <button onClick={handleDetectLocation} className="detect-location-btn">
              Detect My Location
            </button>
            {locationMessage && <p className="location-message">{locationMessage}</p>}
            {userLocation && address ? (
              <p>
                Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
                {userLocation.lon.toFixed(4)})
              </p>
            ) : (
              <p>Address not detected. Please enter manually.</p>
            )}
            {showManualLocation && (
              <div className="manual-location">
                <p>Enter location manually:</p>
                <input
                  type="number"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Latitude (-90 to 90)"
                  className="manual-input"
                />
                <input
                  type="number"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  placeholder="Longitude (-180 to 180)"
                  className="manual-input"
                />
                <button onClick={handleManualLocationUpdate} className="manual-location-btn">
                  Submit Manual Location
                </button>
              </div>
            )}
            <textarea
              value={manualAddress}
              onChange={(e) => {
                setManualAddress(e.target.value);
                validateManualAddress(e.target.value);
              }}
              placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
              rows="3"
            />
            {addressError && <p className="address-error">{addressError}</p>}

            <h3>Payment Method</h3>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>

            <div className="emi-option">
              <button onClick={handleApplyEMI}>
                Apply for EMI (No Credit Card Needed)
              </button>
            </div>

            <div className="checkout-action">
              <button onClick={handleCheckout} disabled={loading}>
                {loading ? 'Processing...' : 'Place Orders'}
              </button>
            </div>
          </div>

          {showEMIModal && (
            <ApplyEMI
              productId={productId}
              productName={productName}
              productPrice={productPrice}
              sellerId={sellerId}
              onClose={() => setShowEMIModal(false)}
            />
          )}
        </>
      )}
      <Footer />
    </div>
  );
}

export default Checkout;