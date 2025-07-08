

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




// import React, { useState, useEffect, useContext, useCallback } from 'react';
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

// // Utility to debounce a function
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

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
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   // Debounced address fetch from Account.js
//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error('Failed to fetch address');
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress); // Auto-populate manual address
//         setLocationMessage('Address fetched successfully.');
//       } catch (e) {
//         console.error('fetchAddress error', e);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//       }
//     }, 500),
//     []
//   );

//   // Detect user location (adapted from Account.js)
//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported by your browser. Please enter manually.');
//       setShowManualLocation(true);
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lon = pos.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         setBuyerLocation(newLoc); // Update LocationContext
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//       },
//       (err) => {
//         setLocationMessage('Location permission denied or timed out. Please enter manually.');
//         setShowManualLocation(true);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [setBuyerLocation, debouncedFetchAddress]);

//   // Manual location update
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
//     const newLoc = { lat, lon };
//     setUserLocation(newLoc);
//     setBuyerLocation(newLoc);
//     debouncedFetchAddress(lat, lon);
//     setShowManualLocation(false);
//     setManualLat('');
//     setManualLon('');
//     setLocationMessage('Manual location set successfully.');
//   }, [manualLat, manualLon, setBuyerLocation, debouncedFetchAddress]);

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
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setError('Unable to detect location; using default Bengaluru location.');
//       // Auto-detect location on mount
//       handleDetectLocation();
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, setError, fetchCartProducts, debouncedFetchAddress, handleDetectLocation]);

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

//   const simulatePayment = async () => {
//     // TODO: Replace with real payment gateway
//     return true; // Always succeed for testing
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 5) {
//       throw new Error('Please provide a valid shipping address (minimum 5 characters).');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 1) {
//       throw new Error('Shipping address must include at least one component (e.g., city).');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a city (e.g., Bangalore).');
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
//         setError('Please log in to complete your purchase.');
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const paymentSuccess = await retryRequest(simulatePayment, 3, 1000);
//       if (!paymentSuccess) {
//         throw new Error('Payment processing failed. Please try again.');
//       }

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

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
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

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading-spinner">Processing...</div>;
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
//             <button onClick={handleDetectLocation} className="detect-location-btn">
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p>
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p>Address not detected. Please enter manually.</p>
//             )}
//             {showManualLocation && (
//               <div className="manual-location">
//                 <p>Enter location manually:</p>
//                 <input
//                   type="number"
//                   value={manualLat}
//                   onChange={(e) => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   className="manual-input"
//                 />
//                 <input
//                   type="number"
//                   value={manualLon}
//                   onChange={(e) => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   className="manual-input"
//                 />
//                 <button onClick={handleManualLocationUpdate} className="manual-location-btn">
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
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



// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon || sellerLoc.lat === 0 || sellerLoc.lon === 0) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) * Math.cos((sellerLoc.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null);
// }

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [showManualLocation, setShowManualLocation] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter manually.');
//       setShowManualLocation(true);
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async position => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         setBuyerLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       err => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable to detect location. Please enter manually.');
//         setShowManualLocation(true);
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [setBuyerLocation, debouncedFetchAddress]);

//   const handleManualLocationUpdate = useCallback(async () => {
//     if (!manualLat || !manualLon) {
//       setLocationMessage('Please enter both latitude and longitude.');
//       toast.error('Enter both latitude and longitude.', { duration: 3000 });
//       return;
//     }
//     const lat = parseFloat(manualLat);
//     const lon = parseFloat(manualLon);
//     if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setLocationMessage('Invalid latitude or longitude values.');
//       toast.error('Invalid latitude or longitude.', { duration: 3000 });
//       return;
//     }
//     const newLoc = { lat, lon };
//     setUserLocation(newLoc);
//     setBuyerLocation(newLoc);
//     debouncedFetchAddress(lat, lon);
//     setShowManualLocation(false);
//     setManualLat('');
//     setManualLon('');
//     setLocationMessage('Manual location set successfully.');
//     toast.success('Manual location set successfully.', { duration: 3000 });
//   }, [manualLat, manualLon, setBuyerLocation, debouncedFetchAddress]);

//   useEffect(() => {
//     const initializeCart = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//         if (sessErr || !session?.user) {
//           setError('Please log in to view your cart.');
//           setCartItems([]);
//           setProducts([]);
//           setCartCount(0);
//           localStorage.setItem('cart', JSON.stringify([]));
//           toast.error('Please log in to checkout.', { duration: 3000 });
//           navigate('/auth');
//           return;
//         }

//         const userId = session.user.id;
//         console.log('Fetching cart for user:', userId);
//         const { data: rows, error: cartErr } = await retryRequest(() =>
//           supabase
//             .from('cart')
//             .select('id, product_id, variant_id, quantity, price, title')
//             .eq('user_id', userId)
//         );
//         if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//         const validCart = rows || [];
//         console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//         setCartItems(validCart);
//         localStorage.setItem('cart', JSON.stringify(validCart));
//         setCartCount(validCart.length);

//         if (!validCart.length) {
//           setProducts([]);
//           setError('Your cart is empty.');
//           toast.error('Cart is empty.', { duration: 3000 });
//           return;
//         }

//         if (!userLocation?.lat || !userLocation?.lon) {
//           setError('Location data unavailable. Please set your location.');
//           toast.error('Please set your location.', { duration: 3000 });
//           return;
//         }

//         await fetchCartProducts(validCart);
//       } catch (e) {
//         console.error('Initialize cart error:', e.message);
//         setError(`Failed to load cart: ${e.message}`);
//         toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('Using default Bengaluru location. Detect or enter your location.');
//       handleDetectLocation();
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, setError, fetchCartProducts, debouncedFetchAddress, handleDetectLocation, setCartCount, navigate]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const price = product.selectedVariant?.price || product.price || 0;
//     console.log('Calculating total for product:', { id: product.id, price, quantity });
//     return sum + price * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find(p => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const price = variant?.price || product.price || 0;
//       const sellerId = product.seller_id;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = [];
//       }
//       itemsBySeller[sellerId].push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price
//       });
//     }
//     console.log('Grouped items by seller:', itemsBySeller);
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         if (distance === null || distance > 40) {
//           throw new Error(`Seller ${sellerId} is out of delivery range.`);
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
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
//               estimated_delivery: estimatedDelivery.toISOString()
//             })
//             .select()
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map(item => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = async () => {
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     return true;
//   };

//   const validateAddress = address => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some(comp => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
//     }
//     return true;
//   };

//   const validateManualAddress = address => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async e => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to complete your purchase.');
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const paymentSuccess = await retryRequest(simulatePayment, 3, 1000);
//       if (!paymentSuccess) {
//         throw new Error('Payment processing failed. Please try again.');
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error.message);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta property="og:description" content="Your order has been successfully placed on Markeet." />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta name="twitter:description" content="Your order has been successfully placed on Markeet." />
//           <meta name="twitter:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
//               url: pageUrl
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta name="keywords" content="checkout, ecommerce, electronics, appliances, fashion, Markeet" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta property="og:description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta name="twitter:description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta name="twitter:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || 'Unnamed Product';
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val && val.trim())
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={e => {
//                       console.warn(`Image failed to load for ${productName}: ${product.images?.[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <span className="checkout-item-price">
//                         ₹{(variant?.price || product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > (variant?.price || product.price) && (
//                         <span className="checkout-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually.</p>
//             )}
//             <button
//               onClick={() => setShowManualLocation(!showManualLocation)}
//               className="toggle-manual-btn"
//               aria-label={showManualLocation ? 'Hide manual location input' : 'Enter location manually'}
//             >
//               {showManualLocation ? 'Hide Manual Location' : 'Enter Location Manually'}
//             </button>
//             {showManualLocation && (
//               <div className="manual-location">
//                 <label htmlFor="manual-lat">Latitude:</label>
//                 <input
//                   id="manual-lat"
//                   type="number"
//                   value={manualLat}
//                   onChange={e => setManualLat(e.target.value)}
//                   placeholder="Latitude (-90 to 90)"
//                   className="manual-input"
//                   aria-label="Enter latitude"
//                 />
//                 <label htmlFor="manual-lon">Longitude:</label>
//                 <input
//                   id="manual-lon"
//                   type="number"
//                   value={manualLon}
//                   onChange={e => setManualLon(e.target.value)}
//                   placeholder="Longitude (-180 to 180)"
//                   className="manual-input"
//                   aria-label="Enter longitude"
//                 />
//                 <button
//                   onClick={handleManualLocationUpdate}
//                   className="manual-location-btn"
//                   disabled={loading}
//                   aria-label="Submit manual location"
//                 >
//                   Submit Manual Location
//                 </button>
//               </div>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={e => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={e => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0}
//                 aria-label="Place orders"
//               >
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




// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.lat || !sellerLoc?.lon || sellerLoc.lat === 0 || sellerLoc.lon === 0) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) * Math.cos((sellerLoc.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null);
// }

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter address manually.');
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async position => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         setBuyerLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       err => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable to detect location. Please enter address manually.');
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [setBuyerLocation, debouncedFetchAddress]);

//   useEffect(() => {
//     const initializeCart = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//         if (sessErr || !session?.user) {
//           setError('Please log in to view your cart.');
//           setCartItems([]);
//           setProducts([]);
//           setCartCount(0);
//           localStorage.setItem('cart', JSON.stringify([]));
//           toast.error('Please log in to checkout.', { duration: 3000 });
//           navigate('/auth');
//           return;
//         }

//         const userId = session.user.id;
//         console.log('Fetching cart for user:', userId);
//         const { data: rows, error: cartErr } = await retryRequest(() =>
//           supabase
//             .from('cart')
//             .select('id, product_id, variant_id, quantity, price, title')
//             .eq('user_id', userId)
//         );
//         if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//         const validCart = rows || [];
//         console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//         if (validCart.length === 0) {
//           setCartItems([]);
//           setProducts([]);
//           setCartCount(0);
//           localStorage.setItem('cart', JSON.stringify([]));
//           setError('Your cart is empty.');
//           toast.error('Cart is empty.', { duration: 3000 });
//           return;
//         }

//         setCartItems(validCart);
//         localStorage.setItem('cart', JSON.stringify(validCart));
//         setCartCount(validCart.length);

//         if (!userLocation?.lat || !userLocation?.lon) {
//           console.warn('No valid userLocation, using default:', DEFAULT_LOCATION);
//           setUserLocation(DEFAULT_LOCATION);
//           setError('Location data unavailable. Using default location.');
//           toast.error('Please set your location.', { duration: 3000 });
//         }

//         await fetchCartProducts(validCart);
//       } catch (e) {
//         console.error('Initialize cart error:', e.message);
//         setError(`Failed to load cart: ${e.message}`);
//         toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('Using default Bengaluru location. Detect your location.');
//       handleDetectLocation();
//     }

//     initializeCart();
//   }, [buyerLocation, setError, fetchCartProducts, debouncedFetchAddress, handleDetectLocation, setCartCount, navigate]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     if (!cartItem) {
//       console.warn('No cartItem found for product:', product.id, product.cartId);
//       return sum;
//     }
//     const quantity = cartItem.quantity || 1;
//     const basePrice = parseFloat(product.selectedVariant?.price || product.price || cartItem.price || 0);
//     const discount = parseFloat(product.selectedVariant?.discount_amount || product.discount_amount || 0);
//     const finalPrice = basePrice - discount;
//     if (finalPrice <= 0) {
//       console.warn('Invalid final price for product:', { id: product.id, basePrice, discount, finalPrice });
//       toast.error(`Invalid price for ${product.title || 'product'}.`, { duration: 3000 });
//     }
//     console.log('Calculating total for product:', { id: product.id, basePrice, discount, finalPrice, quantity, subtotal: finalPrice * quantity });
//     return sum + finalPrice * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find(p => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const basePrice = parseFloat(variant?.price || product.price || item.price || 0);
//       const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//       const finalPrice = basePrice - discount;
//       const sellerId = product.seller_id;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = [];
//       }
//       itemsBySeller[sellerId].push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price: finalPrice
//       });
//     }
//     console.log('Grouped items by seller:', JSON.stringify(itemsBySeller, null, 2));
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         if (distance === null || distance > 40) {
//           throw new Error(`Seller ${sellerId} is out of delivery range.`);
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
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
//               estimated_delivery: estimatedDelivery.toISOString()
//             })
//             .select()
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map(item => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = async () => {
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     return true;
//   };

//   const validateAddress = address => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some(comp => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
//     }
//     return true;
//   };

//   const validateManualAddress = address => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async e => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to complete your purchase.');
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       const paymentSuccess = await retryRequest(simulatePayment, 3, 1000);
//       if (!paymentSuccess) {
//         throw new Error('Payment processing failed. Please try again.');
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error.message);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta property="og:description" content="Your order has been successfully placed on Markeet." />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta name="twitter:description" content="Your order has been successfully placed on Markeet." />
//           <meta name="twitter:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
//               url: pageUrl
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta name="keywords" content="checkout, ecommerce, electronics, appliances, fashion, Markeet" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta property="og:description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta name="twitter:description" content="Complete your purchase on Markeet with secure payment options." />
//         <meta name="twitter:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
//                 toast.error(`Cart item not found for ${product.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || cartItem.title || 'Unnamed Product';
//               const basePrice = parseFloat(variant?.price || product.price || cartItem.price || 0);
//               const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//               const originalPrice = parseFloat(variant?.original_price || product.original_price || basePrice);
//               const finalPrice = basePrice - discount;
//               if (finalPrice <= 0) {
//                 console.warn('Invalid final price for rendering product:', { id: product.id, basePrice, discount, finalPrice });
//                 toast.error(`Price missing for ${productName}.`, { duration: 3000 });
//               }
//               const hasDiscount = discount > 0 && originalPrice > finalPrice;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, val]) => val && val.trim())
//                     .map(([key, val]) => `${key}: ${val}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={e => {
//                       console.warn(`Image failed to load for ${productName}: ${product.images?.[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                         {hasDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{originalPrice.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{discount.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                     <p>Subtotal: ₹{(finalPrice * quantity).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2
//                     })}</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={e => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={e => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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


// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.lat ||
//     !sellerLoc?.lon ||
//     sellerLoc.lat === 0 ||
//     sellerLoc.lon === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//       Math.cos((sellerLoc.lat * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return (
//     item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null)
//   );
// }

// function Checkout() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter address manually.');
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       (err) => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable to detect location. Please enter address manually.');
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [debouncedFetchAddress]);

//   useEffect(() => {
//     // Synchronize userLocation with buyerLocation
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(null);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('No location set. Detect your location or enter address manually.');
//       toast.error('Please set your location.', { duration: 3000 });
//     }
//   }, [buyerLocation, debouncedFetchAddress]);

//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const {
//         data: { session },
//         error: sessErr,
//       } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId);
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//       const validCart = rows || [];
//       console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//       if (validCart.length === 0) {
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setError('Your cart is empty.');
//         toast.error('Cart is empty.', { duration: 3000 });
//         return;
//       }

//       setCartItems(validCart);
//       localStorage.setItem('cart', JSON.stringify(validCart));
//       setCartCount(validCart.length);

//       await fetchCartProducts(validCart);
//     } catch (e) {
//       console.error('Initialize cart error:', e.message);
//       setError(`Failed to load cart: ${e.message}`);
//       toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, navigate, setError, setProducts]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     if (!cartItem) {
//       console.warn('No cartItem found for product:', product.id, product.cartId);
//       return sum;
//     }
//     const quantity = cartItem.quantity || 1;
//     const basePrice = parseFloat(
//       product.selectedVariant?.price || product.price || cartItem.price || 0
//     );
//     const discount = parseFloat(
//       product.selectedVariant?.discount_amount || product.discount_amount || 0
//     );
//     const finalPrice = basePrice - discount;
//     if (finalPrice <= 0) {
//       console.warn('Invalid final price for product:', {
//         id: product.id,
//         basePrice,
//         discount,
//         finalPrice,
//       });
//       toast.error(`Invalid price for ${product.title || 'product'}.`, { duration: 3000 });
//     }
//     console.log('Calculating total for product:', {
//       id: product.id,
//       basePrice,
//       discount,
//       finalPrice,
//       quantity,
//       subtotal: finalPrice * quantity,
//     });
//     return sum + finalPrice * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find((p) => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const basePrice = parseFloat(variant?.price || product.price || item.price || 0);
//       const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//       const finalPrice = basePrice - discount;
//       const sellerId = product.seller_id;
//       const effectiveRadius = product.deliveryRadius || 40;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = { items: [], effectiveRadius };
//       }
//       itemsBySeller[sellerId].items.push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price: finalPrice,
//       });
//     }
//     console.log('Grouped items by seller:', JSON.stringify(itemsBySeller, null, 2));
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         const effectiveRadius = itemsBySeller[sellerId].effectiveRadius;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Seller ${sellerId} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);
//         const sellerItems = itemsBySeller[sellerId].items;
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
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const simulatePayment = async () => {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     return true;
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
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
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to complete your purchase.');
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       // Validate all products are within delivery radius
//       for (const product of products) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', product.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           throw new Error(`Seller not found for product ${product.title}`);
//         }
//         const distance = calculateDistance(shippingLocation, {
//           lat: sellerData.latitude,
//           lon: sellerData.longitude,
//         });
//         const effectiveRadius = product.deliveryRadius || 40;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Product ${product.title} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }
//       }

//       const paymentSuccess = await retryRequest(simulatePayment, 3, 1000);
//       if (!paymentSuccess) {
//         throw new Error('Payment processing failed. Please try again.');
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() => supabase.from('cart').delete().eq('user_id', session.user.id));

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error.message);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">
//           Your cart is empty or items are not available in your location.
//         </p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', {
//                   id: product.id,
//                   variantId: product.selectedVariant?.id,
//                 });
//                 toast.error(`Failed to load ${product.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || cartItem.title || 'Unnamed Product';
//               const basePrice = parseFloat(
//                 variant?.price || product.price || cartItem.price || 0
//               );
//               const discount = parseFloat(
//                 variant?.discount_amount || product.discount_amount || 0
//               );
//               const originalPrice = parseFloat(
//                 variant?.original_price || product.original_price || basePrice
//               );
//               const finalPrice = basePrice - discount;
//               if (finalPrice <= 0) {
//                 console.warn('Invalid final price for rendering product:', {
//                   id: product.id,
//                   basePrice,
//                   discount,
//                   finalPrice,
//                 });
//                 toast.error(`Price missing for ${productName}.`, { duration: 3000 });
//               }
//               const hasCheckoutDiscount = discount > 0 && originalPrice > finalPrice;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, value]) => value && value.trim())
//                     .map(([key, value]) => `${key}: ${value}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={(e) => {
//                       console.warn(
//                         `Image failed to load for ${productName}: ${product.images?.[0]}`
//                       );
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                         {hasCheckoutDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{originalPrice.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{discount.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Subtotal: ₹{(finalPrice * quantity).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Delivery Radius: {product.deliveryRadius} km</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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


// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.lat ||
//     !sellerLoc?.lon ||
//     sellerLoc.lat === 0 ||
//     sellerLoc.lon === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//       Math.cos((sellerLoc.lat * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return (
//     item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null)
//   );
// }

// function Checkout() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter address manually.');
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       (err) => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable to detect location. Please enter address manually.');
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [debouncedFetchAddress]);

//   useEffect(() => {
//     // Load Razorpay SDK dynamically
//     const script = document.createElement('script');
//     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     script.async = true;
//     document.body.appendChild(script);
//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   useEffect(() => {
//     // Synchronize userLocation with buyerLocation
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(null);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('No location set. Detect your location or enter address manually.');
//       toast.error('Please set your location.', { duration: 3000 });
//     }
//   }, [buyerLocation, debouncedFetchAddress]);

//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const {
//         data: { session },
//         error: sessErr,
//       } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId);
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//       const validCart = rows || [];
//       console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//       if (validCart.length === 0) {
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setError('Your cart is empty.');
//         toast.error('Cart is empty.', { duration: 3000 });
//         return;
//       }

//       setCartItems(validCart);
//       localStorage.setItem('cart', JSON.stringify(validCart));
//       setCartCount(validCart.length);

//       await fetchCartProducts(validCart);
//     } catch (e) {
//       console.error('Initialize cart error:', e.message);
//       setError(`Failed to load cart: ${e.message}`);
//       toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, navigate, setError, setProducts]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     if (!cartItem) {
//       console.warn('No cartItem found for product:', product.id, product.cartId);
//       return sum;
//     }
//     const quantity = cartItem.quantity || 1;
//     const basePrice = parseFloat(
//       product.selectedVariant?.price || product.price || cartItem.price || 0
//     );
//     const discount = parseFloat(
//       product.selectedVariant?.discount_amount || product.discount_amount || 0
//     );
//     const finalPrice = basePrice - discount;
//     if (finalPrice <= 0) {
//       console.warn('Invalid final price for product:', {
//         id: product.id,
//         basePrice,
//         discount,
//         finalPrice,
//       });
//       toast.error(`Invalid price for ${product.title || 'product'}.`, { duration: 3000 });
//     }
//     console.log('Calculating total for product:', {
//       id: product.id,
//       basePrice,
//       discount,
//       finalPrice,
//       quantity,
//       subtotal: finalPrice * quantity,
//     });
//     return sum + finalPrice * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find((p) => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const basePrice = parseFloat(variant?.price || product.price || item.price || 0);
//       const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//       const finalPrice = basePrice - discount;
//       const sellerId = product.seller_id;
//       const effectiveRadius = product.deliveryRadius || 40;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = { items: [], effectiveRadius };
//       }
//       itemsBySeller[sellerId].items.push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price: finalPrice,
//       });
//     }
//     console.log('Grouped items by seller:', JSON.stringify(itemsBySeller, null, 2));
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress, razorpayPaymentId) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         const effectiveRadius = itemsBySeller[sellerId].effectiveRadius;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Seller ${sellerId} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);
//         const sellerItems = itemsBySeller[sellerId].items;
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
//               payment_id: razorpayPaymentId,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const initiateRazorpayPayment = async (orderDetails, sessionUser) => {
//     try {
//       // Create order on backend (assumes a Supabase function or backend endpoint)
//       const { data: razorpayOrder, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
//         body: JSON.stringify({
//           amount: total * 100, // Razorpay expects amount in paise
//           currency: 'INR',
//           receipt: `receipt_${sessionUser.id}_${Date.now()}`,
//         }),
//       });
//       if (orderError || !razorpayOrder?.id) {
//         throw new Error('Failed to create Razorpay order');
//       }

//       const options = {
//         key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Add your Razorpay Key ID in .env
//         amount: total * 100,
//         currency: 'INR',
//         name: 'FreshCart',
//         description: 'Order Payment',
//         image: 'https://www.markeet.com/logo.png',
//         order_id: razorpayOrder.id,
//         handler: async function (response) {
//           try {
//             // Verify payment on backend
//             const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//             });
//             if (verifyError || !verificationResult.success) {
//               throw new Error('Payment verification failed');
//             }
//             return response.razorpay_payment_id;
//           } catch (error) {
//             throw new Error(`Payment verification error: ${error.message}`);
//           }
//         },
//         prefill: {
//           name: sessionUser.user_metadata?.name || 'Customer',
//           email: sessionUser.email,
//           contact: sessionUser.user_metadata?.phone || '',
//         },
//         notes: {
//           user_id: sessionUser.id,
//         },
//         theme: {
//           color: '#1a73e8',
//         },
//       };

//       const paymentObject = new window.Razorpay(options);
//       paymentObject.on('payment.failed', function (response) {
//         console.error('Razorpay payment failed:', response.error);
//         toast.error(`Payment failed: ${response.error.description}`, { duration: 4000 });
//       });
//       paymentObject.open();
//       return new Promise((resolve, reject) => {
//         paymentObject.on('payment.success', (response) => resolve(response.razorpay_payment_id));
//         paymentObject.on('payment.error', (error) => reject(error));
//       });
//     } catch (error) {
//       throw new Error(`Razorpay payment initiation error: ${error.message}`);
//     }
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
//     }
//     return true;
//   };

//   const validateManualAddress = ( address) => {
//     try {
//       validateAddress(address);
//       setAddressError('');
//       return true;
//     } catch (error) {
//       setAddressError(error.message);
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to complete your purchase.');
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       // Validate all products are within delivery radius
//       for (const product of products) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', product.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           throw new Error(`Seller not found for product ${product.title}`);
//         }
//         const distance = calculateDistance(shippingLocation, {
//           lat: sellerData.latitude,
//           lon: sellerData.longitude,
//         });
//         const effectiveRadius = product.deliveryRadius || 40;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Product ${product.title} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }
//       }

//       let paymentSuccess = true;
//       let razorpayPaymentId = null;
//       if (paymentMethod === 'razorpay') {
//         razorpayPaymentId = await retryRequest(() => initiateRazorpayPayment({ total }, session.user), 3, 1000);
//         if (!razorpayPaymentId) {
//           throw new Error('Payment processing failed. Please try again.');
//         }
//       } else {
//         // Handle other payment methods (e.g., cash_on_delivery)
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate other payment processing
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress, razorpayPaymentId);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() => supabase.from('cart').delete().eq('user_id', session.user.id));

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error.message);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">
//           Your cart is empty or items are not available in your location.
//         </p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', {
//                   id: product.id,
//                   variantId: product.selectedVariant?.id,
//                 });
//                 toast.error(`Failed to load ${product.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || cartItem.title || 'Unnamed Product';
//               const basePrice = parseFloat(
//                 variant?.price || product.price || cartItem.price || 0
//               );
//               const discount = parseFloat(
//                 variant?.discount_amount || product.discount_amount || 0
//               );
//               const originalPrice = parseFloat(
//                 variant?.original_price || product.original_price || basePrice
//               );
//               const finalPrice = basePrice - discount;
//               if (finalPrice <= 0) {
//                 console.warn('Invalid final price for rendering product:', {
//                   id: product.id,
//                   basePrice,
//                   discount,
//                   finalPrice,
//                 });
//                 toast.error(`Price missing for ${productName}.`, { duration: 3000 });
//               }
//               const hasCheckoutDiscount = discount > 0 && originalPrice > finalPrice;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, value]) => value && value.trim())
//                     .map(([key, value]) => `${key}: ${value}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={(e) => {
//                       console.warn(
//                         `Image failed to load for ${productName}: ${product.images?.[0]}`
//                       );
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                         {hasCheckoutDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{originalPrice.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{discount.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Subtotal: ₹{(finalPrice * quantity).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Delivery Radius: {product.deliveryRadius} km</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="razorpay">Razorpay</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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



// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.lat ||
//     !sellerLoc?.lon ||
//     sellerLoc.lat === 0 ||
//     sellerLoc.lon === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//       Math.cos((sellerLoc.lat * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return (
//     item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null)
//   );
// }

// function Checkout() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter address manually.');
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       (err) => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable to detect location. Please enter address manually.');
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [debouncedFetchAddress]);

//   useEffect(() => {
//     // Load Razorpay SDK dynamically
//     const script = document.createElement('script');
//     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     script.async = true;
//     document.body.appendChild(script);
//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   useEffect(() => {
//     // Synchronize userLocation with buyerLocation
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(null);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('No location set. Detect your location or enter address manually.');
//       toast.error('Please set your location.', { duration: 3000 });
//     }
//   }, [buyerLocation, debouncedFetchAddress]);

//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const {
//         data: { session },
//         error: sessErr,
//       } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId);
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//       const validCart = rows || [];
//       console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//       if (validCart.length === 0) {
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setError('Your cart is empty.');
//         toast.error('Cart is empty.', { duration: 3000 });
//         return;
//       }

//       setCartItems(validCart);
//       localStorage.setItem('cart', JSON.stringify(validCart));
//       setCartCount(validCart.length);

//       await fetchCartProducts(validCart);
//     } catch (e) {
//       console.error('Initialize cart error:', e.message);
//       setError(`Failed to load cart: ${e.message}`);
//       toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, navigate, setError, setProducts]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     if (!cartItem) {
//       console.warn('No cartItem found for product:', product.id, product.cartId);
//       return sum;
//     }
//     const quantity = cartItem.quantity || 1;
//     const basePrice = parseFloat(
//       product.selectedVariant?.price || product.price || cartItem.price || 0
//     );
//     const discount = parseFloat(
//       product.selectedVariant?.discount_amount || product.discount_amount || 0
//     );
//     const finalPrice = basePrice - discount;
//     if (finalPrice <= 0) {
//       console.warn('Invalid final price for product:', {
//         id: product.id,
//         basePrice,
//         discount,
//         finalPrice,
//       });
//       toast.error(`Invalid price for ${product.title || 'product'}.`, { duration: 3000 });
//     }
//     console.log('Calculating total for product:', {
//       id: product.id,
//       basePrice,
//       discount,
//       finalPrice,
//       quantity,
//       subtotal: finalPrice * quantity,
//     });
//     return sum + finalPrice * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find((p) => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const basePrice = parseFloat(variant?.price || product.price || item.price || 0);
//       const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//       const finalPrice = basePrice - discount;
//       const sellerId = product.seller_id;
//       const effectiveRadius = product.deliveryRadius || 40;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = { items: [], effectiveRadius };
//       }
//       itemsBySeller[sellerId].items.push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price: finalPrice,
//       });
//     }
//     console.log('Grouped items by seller:', JSON.stringify(itemsBySeller, null, 2));
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress, razorpayPaymentId) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         const effectiveRadius = itemsBySeller[sellerId].effectiveRadius;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Seller ${sellerId} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);
//         const sellerItems = itemsBySeller[sellerId].items;
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
//               payment_id: razorpayPaymentId,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const initiateRazorpayPayment = async (orderDetails, sessionUser) => {
//     try {
//       console.log('Initiating Razorpay payment:', { total, userId: sessionUser.id, accessToken: sessionUser.access_token });
//       const { data: razorpayOrder, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
//         body: JSON.stringify({
//           amount: Math.round(total * 100), // Ensure integer amount in paise
//           currency: 'INR',
//           receipt: `receipt_${sessionUser.id}_${Date.now()}`,
//         }),
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${sessionUser.access_token}`,
//         },
//       });
//       console.log('Razorpay order response:', razorpayOrder, 'Error:', orderError);
//       if (orderError || !razorpayOrder?.id) {
//         throw new Error(`Failed to create Razorpay order: ${orderError?.message || 'No order ID'}`);
//       }

//       const options = {
//         key: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: razorpayOrder.amount,
//         currency: razorpayOrder.currency,
//         name: 'FreshCart',
//         description: 'Order Payment',
//         image: 'https://www.markeet.com/logo.png',
//         order_id: razorpayOrder.id,
//         handler: async function (response) {
//           try {
//             console.log('Payment response:', response);
//             const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${sessionUser.access_token}`,
//               },
//             });
//             console.log('Verification result:', verificationResult, 'Error:', verifyError);
//             if (verifyError || !verificationResult.success) {
//               throw new Error(`Payment verification failed: ${verifyError?.message || 'Invalid response'}`);
//             }
//             return response.razorpay_payment_id;
//           } catch (error) {
//             console.error('Payment verification error:', error);
//             throw new Error(`Payment verification error: ${error.message}`);
//           }
//         },
//         prefill: {
//           name: sessionUser.user_metadata?.name || 'Customer',
//           email: sessionUser.email,
//           contact: sessionUser.user_metadata?.phone || '',
//         },
//         notes: {
//           user_id: sessionUser.id,
//         },
//         theme: {
//           color: '#1a73e8',
//         },
//       };

//       const paymentObject = new window.Razorpay(options);
//       paymentObject.on('payment.failed', function (response) {
//         console.error('Razorpay payment failed:', response.error);
//         toast.error(`Payment failed: ${response.error.description}`, { duration: 4000 });
//       });
//       paymentObject.open();
//       return new Promise((resolve, reject) => {
//         paymentObject.on('payment.success', (response) => resolve(response.razorpay_payment_id));
//         paymentObject.on('payment.error', (error) => reject(error));
//       });
//     } catch (error) {
//       console.error('Razorpay payment initiation error:', error);
//       throw new Error(`Razorpay payment initiation error: ${error.message}`);
//     }
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
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
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to complete your purchase.');
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       for (const product of products) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', product.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           throw new Error(`Seller not found for product ${product.title}`);
//         }
//         const distance = calculateDistance(shippingLocation, {
//           lat: sellerData.latitude,
//           lon: sellerData.longitude,
//         });
//         const effectiveRadius = product.deliveryRadius || 40;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Product ${product.title} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }
//       }

//       let paymentSuccess = true;
//       let razorpayPaymentId = null;
//       if (paymentMethod === 'razorpay') {
//         razorpayPaymentId = await retryRequest(() => initiateRazorpayPayment({ total }, session.user), 3, 1000);
//         if (!razorpayPaymentId) {
//           throw new Error('Payment processing failed. Please try again.');
//         }
//       } else {
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate other payment processing
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress, razorpayPaymentId);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() => supabase.from('cart').delete().eq('user_id', session.user.id));

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error.message);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">
//           Your cart is empty or items are not available in your location.
//         </p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', {
//                   id: product.id,
//                   variantId: product.selectedVariant?.id,
//                 });
//                 toast.error(`Failed to load ${product.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || cartItem.title || 'Unnamed Product';
//               const basePrice = parseFloat(
//                 variant?.price || product.price || cartItem.price || 0
//               );
//               const discount = parseFloat(
//                 variant?.discount_amount || product.discount_amount || 0
//               );
//               const originalPrice = parseFloat(
//                 variant?.original_price || product.original_price || basePrice
//               );
//               const finalPrice = basePrice - discount;
//               if (finalPrice <= 0) {
//                 console.warn('Invalid final price for rendering product:', {
//                   id: product.id,
//                   basePrice,
//                   discount,
//                   finalPrice,
//                 });
//                 toast.error(`Price missing for ${productName}.`, { duration: 3000 });
//               }
//               const hasCheckoutDiscount = discount > 0 && originalPrice > finalPrice;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, value]) => value && value.trim())
//                     .map(([key, value]) => `${key}: ${value}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={(e) => {
//                       console.warn(
//                         `Image failed to load for ${productName}: ${product.images?.[0]}`
//                       );
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                         {hasCheckoutDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{originalPrice.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{discount.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Subtotal: ₹{(finalPrice * quantity).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Delivery Radius: {product.deliveryRadius} km</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="razorpay">Razorpay</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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

// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.lat ||
//     !sellerLoc?.lon ||
//     sellerLoc.lat === 0 ||
//     sellerLoc.lon === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//       Math.cos((sellerLoc.lat * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function matchProduct(item, product) {
//   return (
//     item.product_id === product.id && (item.variant_id || null) === (product.selectedVariant?.id || null)
//   );
// }

// function Checkout() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMessage, setLocationMessage] = useState('');
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   const debouncedFetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const resp = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'FreshCart/1.0' } }
//         );
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch address`);
//         const data = await resp.json();
//         const newAddress = data.display_name || DEFAULT_ADDRESS;
//         setAddress(newAddress);
//         setManualAddress(newAddress);
//         setLocationMessage('Address fetched successfully.');
//         toast.success('Address fetched successfully.', { duration: 3000 });
//       } catch (e) {
//         console.error('fetchAddress error:', e.message);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMessage('Error fetching address. Please enter manually.');
//         toast.error('Failed to fetch address. Enter manually.', { duration: 3000 });
//       }
//     }, 500),
//     []
//   );

//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationMessage('Geolocation not supported. Please enter address manually.');
//       toast.error('Geolocation not supported.', { duration: 3000 });
//       return;
//     }
//     setLocationMessage('Detecting location...');
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         const newLoc = { lat, lon };
//         setUserLocation(newLoc);
//         debouncedFetchAddress(lat, lon);
//         setLocationMessage('Location detected successfully.');
//         toast.success('Location detected successfully.', { duration: 3000 });
//       },
//       (err) => {
//         console.error('Geolocation error:', err.message);
//         setLocationMessage('Unable颜 to detect location. Please enter address manually.');
//         toast.error('Location detection failed. Enter manually.', { duration: 3000 });
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [debouncedFetchAddress]);

//   useEffect(() => {
//     // Load Razorpay SDK dynamically
//     const script = document.createElement('script');
//     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     script.async = true;
//     document.body.appendChild(script);
//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   useEffect(() => {
//     // Synchronize userLocation with buyerLocation
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       debouncedFetchAddress(buyerLocation.lat, buyerLocation.lon);
//     } else {
//       setUserLocation(null);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       setLocationMessage('No location set. Detect your location or enter address manually.');
//       toast.error('Please set your location.', { duration: 3000 });
//     }
//   }, [buyerLocation, debouncedFetchAddress]);

//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const {
//         data: { session },
//         error: sessErr,
//       } = await supabase.auth.getSession();
//       if (sessErr || !session?.user || !session?.access_token) {
//         console.error('Session error:', sessErr, 'Session:', session);
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId);
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);

//       const validCart = rows || [];
//       console.log('Fetched cartItems:', JSON.stringify(validCart, null, 2));
//       if (validCart.length === 0) {
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setError('Your cart is empty.');
//         toast.error('Cart is empty.', { duration: 3000 });
//         return;
//       }

//       setCartItems(validCart);
//       localStorage.setItem('cart', JSON.stringify(validCart));
//       setCartCount(validCart.length);

//       await fetchCartProducts(validCart);
//     } catch (e) {
//       console.error('Initialize cart error:', e.message);
//       setError(`Failed to load cart: ${e.message}`);
//       toast.error(`Failed to load cart: ${e.message}`, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, navigate, setError, setProducts]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     if (!cartItem) {
//       console.warn('No cartItem found for product:', product.id, product.cartId);
//       return sum;
//     }
//     const quantity = cartItem.quantity || 1;
//     const basePrice = parseFloat(
//       product.selectedVariant?.price || product.price || cartItem.price || 0
//     );
//     const discount = parseFloat(
//       product.selectedVariant?.discount_amount || product.discount_amount || 0
//     );
//     const finalPrice = basePrice - discount;
//     if (finalPrice <= 0) {
//       console.warn('Invalid final price for product:', {
//         id: product.id,
//         basePrice,
//         discount,
//         finalPrice,
//       });
//       toast.error(`Invalid price for ${product.title || 'product'}.`, { duration: 3000 });
//     }
//     console.log('Calculating total for product:', {
//       id: product.id,
//       basePrice,
//       discount,
//       finalPrice,
//       quantity,
//       subtotal: finalPrice * quantity,
//     });
//     return sum + finalPrice * quantity;
//   }, 0);

//   function groupCartItemsBySeller() {
//     const itemsBySeller = {};
//     for (const item of cartItems) {
//       const product = products.find((p) => matchProduct(item, p));
//       if (!product) {
//         console.warn(`Product not found for cart item: ${item.product_id}`, item);
//         continue;
//       }

//       const variant = product.selectedVariant;
//       const basePrice = parseFloat(variant?.price || product.price || item.price || 0);
//       const discount = parseFloat(variant?.discount_amount || product.discount_amount || 0);
//       const finalPrice = basePrice - discount;
//       const sellerId = product.seller_id;
//       const effectiveRadius = product.deliveryRadius || 40;

//       if (!itemsBySeller[sellerId]) {
//         itemsBySeller[sellerId] = { items: [], effectiveRadius };
//       }
//       itemsBySeller[sellerId].items.push({
//         product_id: item.product_id,
//         variant_id: item.variant_id || null,
//         quantity: item.quantity || 1,
//         price: finalPrice,
//       });
//     }
//     console.log('Grouped items by seller:', JSON.stringify(itemsBySeller, null, 2));
//     return itemsBySeller;
//   }

//   async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress, razorpayPaymentId) {
//     const itemsBySeller = groupCartItemsBySeller();
//     const errors = [];
//     const newOrderIds = [];

//     for (const sellerId of Object.keys(itemsBySeller)) {
//       try {
//         const { data: sellerData, error: sellerError } = await retryRequest(() =>
//           supabase.from('sellers').select('latitude, longitude').eq('id', sellerId).single()
//         );
//         if (sellerError) throw new Error(`Seller fetch error: ${sellerError.message}`);
//         const sellerLoc = sellerData ? { lat: sellerData.latitude, lon: sellerData.longitude } : null;
//         const distance = sellerLoc && shippingLoc ? calculateDistance(shippingLoc, sellerLoc) : null;
//         const effectiveRadius = itemsBySeller[sellerId].effectiveRadius;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Seller ${sellerId} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }

//         const baseHours = distance <= 10 ? 3 : distance <= 20 ? 12 : 24;
//         const deliveryOffset = baseHours + Math.floor(Math.random() * 12);
//         const sellerItems = itemsBySeller[sellerId].items;
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
//               payment_id: razorpayPaymentId,
//               shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
//               shipping_address: finalAddress,
//               estimated_delivery: estimatedDelivery.toISOString(),
//             })
//             .select()
//             .single()
//         );
//         if (orderError) throw new Error(`Order insert error: ${orderError.message}`);

//         const insertedOrder = orderData;
//         newOrderIds.push(insertedOrder.id);

//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(
//             sellerItems.map((item) => ({
//               order_id: insertedOrder.id,
//               product_id: item.product_id,
//               variant_id: item.variant_id,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           )
//         );
//         if (itemsError) throw new Error(`Order items insert error: ${itemsError.message}`);

//         console.log(
//           `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}, Estimated Delivery: ${estimatedDelivery.toLocaleString()}`
//         );
//       } catch (error) {
//         console.error(`Order error for seller ${sellerId}:`, error.message);
//         errors.push(`Seller ${sellerId}: ${error.message}`);
//       }
//     }

//     if (errors.length > 0) {
//       throw new Error(`Failed to place orders: ${errors.join('; ')}`);
//     }
//     return newOrderIds;
//   }

//   const initiateRazorpayPayment = async (orderDetails, sessionUser) => {
//     try {
//       if (!sessionUser?.access_token) {
//         console.error('No access token available for user:', sessionUser?.id);
//         throw new Error('Authentication required. Please log in again.');
//       }
//       console.log('Initiating Razorpay payment:', {
//         total: orderDetails.total,
//         userId: sessionUser.id,
//         accessToken: sessionUser.access_token.substring(0, 20) + '...',
//       });
//       const { data: razorpayOrder, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
//         body: JSON.stringify({
//           amount: Math.round(orderDetails.total * 100),
//           currency: 'INR',
//           receipt: `receipt_${sessionUser.id}_${Date.now()}`,
//         }),
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${sessionUser.access_token}`,
//         },
//       });
//       console.log('Razorpay order response:', razorpayOrder, 'Error:', orderError);
//       if (orderError || !razorpayOrder?.id) {
//         throw new Error(`Failed to create Razorpay order: ${orderError?.message || 'No order ID returned'}`);
//       }

//       const options = {
//         key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxx', // Fallback for testing
//         amount: razorpayOrder.amount,
//         currency: razorpayOrder.currency,
//         name: 'FreshCart',
//         description: 'Order Payment',
//         image: 'https://www.markeet.com/logo.png',
//         order_id: razorpayOrder.id,
//         handler: async function (response) {
//           try {
//             console.log('Payment response:', response);
//             const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${sessionUser.access_token}`,
//               },
//             });
//             console.log('Verification result:', verificationResult, 'Error:', verifyError);
//             if (verifyError || !verificationResult?.success) {
//               throw new Error(`Payment verification failed: ${verifyError?.message || 'Invalid response'}`);
//             }
//             return response.razorpay_payment_id;
//           } catch (error) {
//             console.error('Payment verification error:', error);
//             throw new Error(`Payment verification error: ${error.message}`);
//           }
//         },
//         prefill: {
//           name: sessionUser.user_metadata?.name || 'Customer',
//           email: sessionUser.email || '',
//           contact: sessionUser.user_metadata?.phone || '',
//         },
//         notes: {
//           user_id: sessionUser.id,
//         },
//         theme: {
//           color: '#1a73e8',
//         },
//       };

//       const paymentObject = new window.Razorpay(options);
//       paymentObject.on('payment.failed', function (response) {
//         console.error('Razorpay payment failed:', response.error);
//         toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`, { duration: 4000 });
//       });
//       paymentObject.open();
//       return new Promise((resolve, reject) => {
//         paymentObject.on('payment.success', (response) => resolve(response.razorpay_payment_id));
//         paymentObject.on('payment.error', (error) => reject(error));
//       });
//     } catch (error) {
//       console.error('Razorpay payment initiation error:', error);
//       throw new Error(`Razorpay payment initiation error: ${error.message}`);
//     }
//   };

//   const validateAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       throw new Error('Shipping address must be at least 10 characters long.');
//     }
//     const components = address.split(/,\s*|\s+/).filter(Boolean);
//     if (components.length < 2) {
//       throw new Error('Shipping address must include at least city and state.');
//     }
//     const hasCity = components.some((comp) => comp.match(/^[A-Za-z\s-]+$/));
//     if (!hasCity) {
//       throw new Error('Shipping address must include a valid city name.');
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
//       toast.error(error.message, { duration: 3000 });
//       return false;
//     }
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (products.length === 0) {
//       setError('Cannot checkout with an empty cart.');
//       toast.error('Cart is empty.', { duration: 3000 });
//       return;
//     }
//     setLoading(true);
//     const originalCart = [...cartItems];
//     try {
//       // Fetch and validate session
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user || !session?.access_token) {
//         console.error('Session error:', sessionError, 'Session:', session);
//         setError('Please log in to complete your purchase.');
//         toast.error('Authentication required. Redirecting to login...', { duration: 3000 });
//         setLoading(false);
//         navigate('/auth');
//         return;
//       }

//       // Force refresh session to ensure valid token
//       const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
//       if (refreshError || !refreshedSession?.user || !refreshedSession?.access_token) {
//         console.error('Session refresh error:', refreshError, 'Refreshed session:', refreshedSession);
//         throw new Error('Failed to refresh session: No valid access token');
//       }
//       session = refreshedSession;
//       console.log('Refreshed session:', {
//         userId: session.user.id,
//         accessToken: session.access_token.substring(0, 20) + '...',
//         expiresAt: new Date(session.expires_at * 1000).toISOString(),
//       });

//       const shippingLocation = userLocation || DEFAULT_LOCATION;
//       const finalAddress = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(finalAddress);

//       for (const product of products) {
//         const { data: sellerData, error: sellerError } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', product.seller_id)
//           .single();
//         if (sellerError || !sellerData) {
//           throw new Error(`Seller not found for product ${product.title}`);
//         }
//         const distance = calculateDistance(shippingLocation, {
//           lat: sellerData.latitude,
//           lon: sellerData.longitude,
//         });
//         const effectiveRadius = product.deliveryRadius || 40;
//         if (distance === null || distance > effectiveRadius) {
//           throw new Error(
//             `Product ${product.title} is out of delivery range (${distance?.toFixed(2)}km > ${effectiveRadius}km).`
//           );
//         }
//       }

//       let razorpayPaymentId = null;
//       if (paymentMethod === 'razorpay') {
//         razorpayPaymentId = await retryRequest(() => initiateRazorpayPayment({ total }, session.user), 3, 1000);
//         if (!razorpayPaymentId) {
//           throw new Error('Payment processing failed. Please try again.');
//         }
//       } else {
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }

//       const newOrderIds = await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress, razorpayPaymentId);

//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.setItem('cart', JSON.stringify([]));
//       await retryRequest(() => supabase.from('cart').delete().eq('user_id', session.user.id));

//       setOrderConfirmed(true);
//       setError(null);
//       toast.success('Order placed successfully!', { duration: 3000 });

//       setTimeout(() => {
//         navigate('/account', { state: { newOrderIds } });
//       }, 2000);
//     } catch (error) {
//       console.error('Checkout error:', error);
//       setCartItems(originalCart);
//       setError(`Checkout failed: ${error.message || 'Please try again.'}`);
//       toast.error(`Checkout failed: ${error.message}`, { duration: 4000 });
//       if (error.message.includes('Authentication required') || error.message.includes('Failed to refresh session')) {
//         setTimeout(() => navigate('/auth'), 2000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     const itemsBySeller = groupCartItemsBySeller();
//     if (Object.keys(itemsBySeller).length > 1) {
//       setError('EMI is only available for products from a single seller.');
//       toast.error('EMI requires products from one seller.', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0) {
//       setError('No products in cart to apply for EMI.');
//       toast.error('Cart is empty for EMI.', { duration: 3000 });
//       return;
//     }
//     setShowEMIModal(true);
//   };

//   const pageUrl = 'https://www.markeet.com/checkout';

//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed - Markeet</title>
//           <meta name="description" content="Your order has been successfully placed on Markeet." />
//           <meta name="keywords" content="order confirmation, checkout, ecommerce, Markeet" />
//           <meta name="robots" content="noindex, follow" />
//           <link rel="canonical" href={pageUrl} />
//           <meta property="og:title" content="Order Confirmed - Markeet" />
//           <meta
//             property="og:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={pageUrl} />
//           <meta property="og:type" content="website" />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content="Order Confirmed - Markeet" />
//           <meta
//             name="twitter:description"
//             content="Your order has been successfully placed on Markeet."
//           />
//           <meta
//             name="twitter:image"
//             content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//           />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'WebPage',
//               name: 'Order Confirmed - Markeet',
//               description: 'Your order has been successfully placed on Markeet.',
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
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta
//           name="description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="keywords"
//           content="checkout, ecommerce, electronics, appliances, fashion, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Checkout - Markeet" />
//         <meta
//           property="og:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta property="og:image" content={products[0]?.images?.[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Checkout - Markeet" />
//         <meta
//           name="twitter:description"
//           content="Complete your purchase on Markeet with secure payment options."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || DEFAULT_IMAGE}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Checkout - Markeet',
//             description: 'Complete your purchase on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="checkout-title">FreshCart Checkout</h1>
//       {products.length === 0 ? (
//         <p className="empty-checkout">
//           Your cart is empty or items are not available in your location.
//         </p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find((item) => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', {
//                   id: product.id,
//                   variantId: product.selectedVariant?.id,
//                 });
//                 toast.error(`Failed to load ${product.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const variant = product.selectedVariant;
//               const productName = product.title || cartItem.title || 'Unnamed Product';
//               const basePrice = parseFloat(
//                 variant?.price || product.price || cartItem.price || 0
//               );
//               const discount = parseFloat(
//                 variant?.discount_amount || product.discount_amount || 0
//               );
//               const originalPrice = parseFloat(
//                 variant?.original_price || product.original_price || basePrice
//               );
//               const finalPrice = basePrice - discount;
//               if (finalPrice <= 0) {
//                 console.warn('Invalid final price for rendering product:', {
//                   id: product.id,
//                   basePrice,
//                   discount,
//                   finalPrice,
//                 });
//                 toast.error(`Price missing for ${productName}.`, { duration: 3000 });
//               }
//               const hasCheckoutDiscount = discount > 0 && originalPrice > finalPrice;
//               const variantAttributes = variant?.attributes
//                 ? Object.entries(variant.attributes)
//                     .filter(([key, value]) => value && value.trim())
//                     .map(([key, value]) => `${key}: ${value}`)
//                     .join(', ')
//                 : null;

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="checkout-item">
//                   <img
//                     src={product.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${productName} checkout image`}
//                     onError={(e) => {
//                       console.warn(
//                         `Image failed to load for ${productName}: ${product.images?.[0]}`
//                       );
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{productName}</h3>
//                     {variantAttributes && (
//                       <p className="variant-info">Variant: {variantAttributes}</p>
//                     )}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                         {hasCheckoutDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{originalPrice.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{discount.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {quantity}</p>
//                     <p>
//                       Subtotal: ₹{(finalPrice * quantity).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Delivery Radius: {product.deliveryRadius} km</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMessage && <p className="location-message">{locationMessage}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="razorpay">Razorpay</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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

// // export default Checkout;


// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import ApplyEMI from '../components/ApplyEMI';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// // -----------------------------------------------------------------------------
// // CONSTANTS
// // -----------------------------------------------------------------------------
// const DEFAULT_IMAGE =
//   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';
// const DELIVERY_RADIUS_FALLBACK = 40; // km
// const RZP_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxx';

// // -----------------------------------------------------------------------------
// // HELPER UTILS
// // -----------------------------------------------------------------------------
// /** Simple debounce */
// const debounce = (fn, delay = 500) => {
//   let tId;
//   return (...args) => {
//     clearTimeout(tId);
//     tId = setTimeout(() => fn(...args), delay);
//   };
// };

// /** Haversine distance (km) */
// function calculateDistance(a, b) {
//   if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
//   const R = 6371;
//   const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//   const dLon = ((b.lon - a.lon) * Math.PI) / 180;
//   const sLat = Math.sin(dLat / 2);
//   const sLon = Math.sin(dLon / 2);
//   const h =
//     sLat ** 2 +
//     Math.cos((a.lat * Math.PI) / 180) *
//       Math.cos((b.lat * Math.PI) / 180) *
//       sLon ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
// }

// /** Generic retry wrapper */
// const retryRequest = async (fn, maxAttempts = 3, delay = 1000) => {
//   for (let i = 1; i <= maxAttempts; i += 1) {
//     try {
//       return await fn();
//     } catch (err) {
//       if (i === maxAttempts) throw err;
//       console.warn(`Attempt ${i} failed – retrying in ${delay}ms`, err);
//       await new Promise((r) => setTimeout(r, delay));
//       delay *= 2;
//     }
//   }
// };

// const matchProduct = (item, product) =>
//   item.product_id === product.id &&
//   (item.variant_id ?? null) === (product.selectedVariant?.id ?? null);

// // -----------------------------------------------------------------------------
// // COMPONENT
// // -----------------------------------------------------------------------------
// export default function Checkout() {
//   // CONTEXT ------------------------------------------------
//   const { buyerLocation, setCartCount } = useContext(LocationContext);

//   // STATE --------------------------------------------------
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [locationMsg, setLocationMsg] = useState('');

//   // HOOKS --------------------------------------------------
//   const navigate = useNavigate();
//   const {
//     fetchCartProducts,
//     products,
//     loading,
//     error,
//     setLoading,
//     setError,
//     setProducts,
//   } = useFetchCartProducts(userLocation);

//   // ---------------------------------------------------------------------------
//   // EFFECTS / CALLBACKS
//   // ---------------------------------------------------------------------------
//   /** Reverse-geocode helper – debounced */
//   const fetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'Markeet/1.0' } },
//         );
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         const displayName = data.display_name || DEFAULT_ADDRESS;
//         setAddress(displayName);
//         setManualAddress(displayName);
//         setLocationMsg('Address fetched.');
//         toast.success('Address fetched.');
//       } catch (err) {
//         console.error('fetchAddress:', err);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMsg('Reverse‑geocoding failed – enter manually.');
//         toast.error('Failed to fetch address.');
//       }
//     }),
//     [],
//   );

//   /** Detect browser location */
//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation not supported by browser.');
//       return;
//     }
//     setLocationMsg('Detecting…');
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//         setUserLocation(coords);
//         fetchAddress(coords.lat, coords.lon);
//       },
//       (err) => {
//         console.error('geolocation:', err);
//         setLocationMsg('Unable to detect location.');
//         toast.error('Location detection failed.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 },
//     );
//   }, [fetchAddress]);

//   /** Lazy‑load Razorpay script */
//   useEffect(() => {
//     if (document.querySelector('#razorpay-js')) return; // prevent duplicates
//     const s = document.createElement('script');
//     s.src = 'https://checkout.razorpay.com/v1/checkout.js';
//     s.id = 'razorpay-js';
//     s.async = true;
//     document.body.appendChild(s);
//     return () => document.body.removeChild(s);
//   }, []);

//   /** Sync context location */
//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       fetchAddress(buyerLocation.lat, buyerLocation.lon);
//     }
//   }, [buyerLocation, fetchAddress]);

//   /** Fetch cart + products once location is available */
//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const {
//         data: { session },
//         error: sessionErr,
//       } = await supabase.auth.getSession();

//       if (sessionErr || !session?.user || !session?.access_token) {
//         console.error('Cart session error:', sessionErr, 'Session:', session);
//         localStorage.removeItem('supabase.auth.token');
//         await supabase.auth.signOut();
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const { data: rows, error: cartErr } = await supabase
//         .from('cart')
//         .select('*')
//         .eq('user_id', session.user.id);
//       if (cartErr) throw cartErr;

//       if (!rows?.length) {
//         setError('Your cart is empty.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       setCartItems(rows);
//       localStorage.setItem('cart', JSON.stringify(rows));
//       setCartCount(rows.length);
//       await fetchCartProducts(rows);
//     } catch (err) {
//       console.error('initializeCart:', err);
//       setError(err.message || 'Failed to load cart');
//       toast.error(err.message || 'Failed to load cart', { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, setProducts, setError, setLoading]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   // ---------------------------------------------------------------------------
//   // COMPUTED
//   // ---------------------------------------------------------------------------
//   const total = products.reduce((sum, p) => {
//     const ci = cartItems.find((c) => c.id === p.cartId);
//     if (!ci) return sum;
//     const qty = ci.quantity ?? 1;
//     const price = parseFloat(p.selectedVariant?.price ?? p.price ?? ci.price ?? 0);
//     const disc = parseFloat(p.selectedVariant?.discount_amount ?? p.discount_amount ?? 0);
//     const finalPrice = price - disc;
//     return sum + finalPrice * qty;
//   }, 0);

//   /** Group cart items by seller */
//   const groupCartItemsBySeller = () => {
//     const map = {};
//     cartItems.forEach((ci) => {
//       const prod = products.find((p) => matchProduct(ci, p));
//       if (!prod) return;
//       const seller = prod.seller_id;
//       if (!map[seller]) map[seller] = { items: [], effectiveRadius: prod.deliveryRadius ?? DELIVERY_RADIUS_FALLBACK };
//       const price = parseFloat(prod.selectedVariant?.price ?? prod.price ?? ci.price ?? 0);
//       const disc = parseFloat(prod.selectedVariant?.discount_amount ?? prod.discount_amount ?? 0);
//       map[seller].items.push({
//         product_id: ci.product_id,
//         variant_id: ci.variant_id ?? null,
//         quantity: ci.quantity ?? 1,
//         price: price - disc,
//       });
//     });
//     return map;
//   };

//   /** Insert orders + items */
//   const placeOrdersForAllSellers = async (
//     userId,
//     shipLoc,
//     shipAddr,
//     razorpayPaymentId = null,
//   ) => {
//     const grouped = groupCartItemsBySeller();
//     const newOrderIds = [];

//     for (const [sellerId, { items, effectiveRadius }] of Object.entries(grouped)) {
//       const { data: sellerData, error: sellerErr } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', sellerId)
//         .single();

//       if (sellerErr) throw sellerErr;

//       const sellerLoc = { lat: sellerData.latitude, lon: sellerData.longitude };
//       const distKm = calculateDistance(shipLoc, sellerLoc);
//       if (distKm === null || distKm > effectiveRadius) {
//         throw new Error(`Seller out of range (${distKm?.toFixed(1)} km)`);
//       }

//       const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
//       const eta = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

//       const { data: orderRow, error: orderErr } = await supabase
//         .from('orders')
//         .insert({
//           user_id: userId,
//           seller_id: sellerId,
//           total: subtotal,
//           order_status: 'pending',
//           payment_method: paymentMethod,
//           payment_id: razorpayPaymentId,
//           shipping_location: `POINT(${shipLoc.lon} ${shipLoc.lat})`,
//           shipping_address: shipAddr,
//           estimated_delivery: eta.toISOString(),
//         })
//         .select()
//         .single();

//       if (orderErr) throw orderErr;
//       newOrderIds.push(orderRow.id);

//       const { error: itemsErr } = await supabase
//         .from('order_items')
//         .insert(items.map((i) => ({ order_id: orderRow.id, ...i })));
//       if (itemsErr) throw itemsErr;
//     }
//     return newOrderIds;
//   };

//   /** Razorpay flow */
//   const initiateRazorpayPayment = async (grandTotal, session) => {
//     try {
//       console.log('Initiating Razorpay payment:', { grandTotal });

//       const { data: orderRes, error: orderErr } = await supabase.functions.invoke(
//         'create-razorpay-order',
//         {
//           body: JSON.stringify({
//             amount: Math.round(grandTotal * 100),
//             currency: 'INR',
//             receipt: `receipt_${session.user.id}_${Date.now()}`,
//           }),
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${session.access_token}`,
//           },
//         },
//       );

//       if (orderErr || !orderRes?.id) {
//         console.error('Razorpay order error:', orderErr);
//         throw new Error(orderErr?.message || 'Failed to create Razorpay order');
//       }

//       return new Promise((resolve, reject) => {
//         const rz = new window.Razorpay({
//           key: RZP_KEY_ID,
//           order_id: orderRes.id,
//           amount: orderRes.amount,
//           currency: orderRes.currency,
//           name: 'Markeet',
//           description: 'Order Payment',
//           image: '/favicon.ico',
//           prefill: {
//             name: session.user.user_metadata?.name || 'Customer',
//             email: session.user.email,
//           },
//           handler: async (resp) => {
//             const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke(
//               'verify-razorpay-payment',
//               {
//                 body: JSON.stringify(resp),
//                 headers: {
//                   'Content-Type': 'application/json',
//                   Authorization: `Bearer ${session.access_token}`,
//                 },
//               },
//             );
//             if (verifyErr || !verifyRes?.success) {
//               toast.error('Payment verification failed.');
//               return reject(new Error(verifyErr?.message || 'Verify failed'));
//             }
//             toast.success('Payment successful');
//             resolve(resp.razorpay_payment_id);
//           },
//           theme: { color: '#056675' },
//         });

//         rz.on('payment.failed', (resp) => {
//           console.error('Razorpay payment failed:', resp.error);
//           toast.error(resp.error?.description || 'Payment failed');
//           reject(new Error('Payment failed'));
//         });

//         rz.open();
//       });
//     } catch (err) {
//       console.error('initiateRazorpayPayment:', err);
//       throw err;
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // ADDRESS VALIDATION
//   // ---------------------------------------------------------------------------
//   const validateAddress = (addr) => {
//     const ok = addr && addr.trim().length >= 10;
//     if (!ok) throw new Error('Address must be at least 10 characters');
//     return true;
//   };

//   const validateManualAddress = (addr) => {
//     try {
//       validateAddress(addr);
//       setAddressError('');
//       return true;
//     } catch (err) {
//       setAddressError(err.message);
//       toast.error(err.message);
//       return false;
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // MAIN CHECKOUT HANDLER
//   // ---------------------------------------------------------------------------
//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (!products.length) return toast.error('Cart is empty');

//     setLoading(true);
//     const originalCart = [...cartItems];

//     try {
//       let {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session?.user || !session?.access_token) {
//         toast.error('Authentication required.');
//         navigate('/auth');
//         return;
//       }

//       const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
//       if (refErr || !refreshed?.session?.access_token) {
//         toast.error('Session expired.');
//         navigate('/auth');
//         return;
//       }

//       session = refreshed.session;

//       const shipLoc = userLocation || DEFAULT_LOCATION;
//       const shipAddr = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(shipAddr);

//       // Delivery radius check
//       for (const p of products) {
//         const { data: sellerLoc, error: sellerErr } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', p.seller_id)
//           .single();
//         if (sellerErr) throw sellerErr;
//         const d = calculateDistance(shipLoc, {
//           lat: sellerLoc.latitude,
//           lon: sellerLoc.longitude,
//         });
//         const radius = p.deliveryRadius || DELIVERY_RADIUS_FALLBACK;
//         if (d === null || d > radius) throw new Error(`${p.title} out of delivery range.`);
//       }

//       let razorpayPaymentId = null;
//       if (paymentMethod === 'razorpay') {
//         razorpayPaymentId = await retryRequest(() => initiateRazorpayPayment(total, session), 3);
//       }

//       const newOrderIds = await placeOrdersForAllSellers(
//         session.user.id,
//         shipLoc,
//         shipAddr,
//         razorpayPaymentId,
//       );

//       // Empty cart
//       await supabase.from('cart').delete().eq('user_id', session.user.id);
//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.removeItem('cart');

//       setOrderConfirmed(true);
//       toast.success('Order placed successfully');
//       setTimeout(() => navigate('/account', { state: { newOrderIds } }), 1500);
//     } catch (err) {
//       console.error('handleCheckout:', err);
//       setCartItems(originalCart);
//       toast.error(err.message || 'Checkout failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApplyEMI = () => {
//     if (!products.length) return toast.error('Cart empty');
//     if (Object.keys(groupCartItemsBySeller()).length > 1)
//       return toast.error('EMI only for single‑seller carts');
//     setShowEMIModal(true);
//   };

//   // ---------------------------------------------------------------------------
//   // RENDER
//   // ---------------------------------------------------------------------------
//   const pageUrl = 'https://www.markeet.com/checkout';
//   if (loading) return <div className="checkout-loading">Loading…</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed – Markeet</title>
//           <meta name="robots" content="noindex" />
//           <link rel="canonical" href={pageUrl} />
//         </Helmet>
//         <h1>Order confirmed!</h1>
//         <p>Redirecting to your account…</p>
//       </div>
//     );
//   }

//   const firstProduct = products[0] || {};
//   const productId = firstProduct.id || null;
//   const productName = firstProduct.title || 'Unnamed Product';
//   const productPrice = firstProduct.selectedVariant?.price || firstProduct.price || 0;
//   const sellerId = firstProduct.seller_id || null;

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout – Markeet</title>
//         <meta name="robots" content="noindex" />
//         <link rel="canonical" href={pageUrl} />
//       </Helmet>

//       <h1 className="checkout-title">Markeet Checkout</h1>

//       {!products.length ? (
//         <p className="empty-checkout">Your cart is empty.</p>
//       ) : (
//         <>
          
//           {/* ITEMS LIST */}
//           <div className="checkout-items">
//             {products.map((p) => {
//               const cartItem = cartItems.find((ci) => ci.id === p.cartId);
//               if (!cartItem) {
//                 console.warn('No cartItem found for product:', p.id, p.cartId);
//                 toast.error(`Failed to load ${p.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }
//               const qty = cartItem.quantity ?? 1;
//               const base = parseFloat(p.selectedVariant?.price ?? p.price ?? cartItem.price ?? 0);
//               const disc = parseFloat(p.selectedVariant?.discount_amount ?? p.discount_amount ?? 0);
//               const finalPrice = base - disc;
//               const original = parseFloat(
//                 p.selectedVariant?.original_price ?? p.original_price ?? base,
//               );
//               const hasDiscount = disc > 0 && original > finalPrice;
//               const attrs = p.selectedVariant?.attributes
//                 ? Object.entries(p.selectedVariant.attributes)
//                     .filter(([, v]) => v)
//                     .map(([k, v]) => `${k}: ${v}`)
//                     .join(', ')
//                 : null;
//               return (
//                 <div className="checkout-item" key={`${p.id}-${cartItem.id}`}>
//                   <img
//                     src={p.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${p.title} checkout image`}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for ${p.title}: ${p.images?.[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                     {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{finalPrice.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                         {hasDiscount && (
//                           <>
//                             <span className="checkout-item-original-price">
//                               ₹{original.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                             <span className="discount-badge">
//                               Save ₹{disc.toLocaleString('en-IN', {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <p>Quantity: {qty}</p>
//                     <p>
//                       Subtotal: ₹{(finalPrice * qty).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <p>Delivery Radius: {p.deliveryRadius || DELIVERY_RADIUS_FALLBACK} km</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* CHECKOUT DETAILS */}
//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMsg && <p className="location-message">{locationMsg}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected Address: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Address not detected. Please enter manually below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address:
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment Method</h3>
//             <label htmlFor="payment-method" className="payment-label">
//               Choose Payment Method:
//             </label>
//             <select
//               id="payment-method"
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//               aria-label="Select payment method"
//             >
//               <option value="razorpay">Razorpay</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <div className="emi-option">
//               <button
//                 onClick={handleApplyEMI}
//                 className="emi-btn"
//                 disabled={loading}
//                 aria-label="Apply for EMI"
//               >
//                 Apply for EMI
//               </button>
//             </div>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place orders"
//               >
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




// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// // -----------------------------------------------------------------------------
// // CONSTANTS
// // -----------------------------------------------------------------------------
// const DEFAULT_IMAGE =
//   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';
// const DELIVERY_RADIUS_FALLBACK = 40; // km

// // -----------------------------------------------------------------------------
// // HELPER UTILS
// // -----------------------------------------------------------------------------
// /** Simple debounce */
// const debounce = (fn, delay = 500) => {
//   let tId;
//   return (...args) => {
//     clearTimeout(tId);
//     tId = setTimeout(() => fn(...args), delay);
//   };
// };

// /** Haversine distance (km) */
// function calculateDistance(a, b) {
//   if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
//   const R = 6371;
//   const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//   const dLon = ((b.lon - a.lon) * Math.PI) / 180;
//   const sLat = Math.sin(dLat / 2);
//   const sLon = Math.sin(dLon / 2);
//   const h =
//     sLat ** 2 +
//     Math.cos((a.lat * Math.PI) / 180) *
//       Math.cos((b.lat * Math.PI) / 180) *
//       sLon ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
// }

// /** Generic retry wrapper */
// const retryRequest = async (fn, maxAttempts = 3, delay = 1000) => {
//   for (let i = 1; i <= maxAttempts; i += 1) {
//     try {
//       return await fn();
//     } catch (err) {
//       if (i === maxAttempts) throw err;
//       console.warn(`Attempt ${i} failed – retrying in ${delay}ms`, err);
//       await new Promise((r) => setTimeout(r, delay));
//       delay *= 2;
//     }
//   }
// };

// const matchProduct = (item, product) =>
//   item.product_id === product.id &&
//   (item.variant_id ?? null) === (product.selectedVariant?.id ?? null);

// // -----------------------------------------------------------------------------
// // COMPONENT
// // -----------------------------------------------------------------------------
// export default function Checkout() {
//   // CONTEXT ------------------------------------------------
//   const { buyerLocation, setCartCount } = useContext(LocationContext);

//   // STATE --------------------------------------------------
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [locationMsg, setLocationMsg] = useState('');

//   // HOOKS --------------------------------------------------
//   const navigate = useNavigate();
//   const {
//     fetchCartProducts,
//     products,
//     loading,
//     error,
//     setLoading,
//     setError,
//     setProducts,
//   } = useFetchCartProducts(userLocation);

//   // ---------------------------------------------------------------------------
//   // EFFECTS / CALLBACKS
//   // ---------------------------------------------------------------------------
//   /** Reverse-geocode helper – debounced */
//   const fetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'Markeet/1.0' } },
//         );
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         const displayName = data.display_name || DEFAULT_ADDRESS;
//         setAddress(displayName);
//         setManualAddress(displayName);
//         setLocationMsg('Address fetched successfully.');
//         toast.success('Address fetched successfully.');
//       } catch (err) {
//         console.error('fetchAddress:', err);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMsg('Unable to fetch address – please enter manually.');
//         toast.error('Failed to fetch address.');
//       }
//     }),
//     [],
//   );

//   /** Detect browser location */
//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation not supported by browser.');
//       return;
//     }
//     setLocationMsg('Detecting location…');
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//         setUserLocation(coords);
//         fetchAddress(coords.lat, coords.lon);
//       },
//       (err) => {
//         console.error('geolocation:', err);
//         setLocationMsg('Unable to detect location.');
//         toast.error('Location detection failed.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 },
//     );
//   }, [fetchAddress]);

//   /** Sync context location */
//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       fetchAddress(buyerLocation.lat, buyerLocation.lon);
//     }
//   }, [buyerLocation, fetchAddress]);

//   /** Fetch cart + products once location is available */
//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const {
//         data: { session },
//         error: sessionErr,
//       } = await supabase.auth.getSession();

//       if (sessionErr || !session?.user || !session?.access_token) {
//         console.error('Cart session error:', sessionErr, 'Session:', session);
//         localStorage.removeItem('supabase.auth.token');
//         await supabase.auth.signOut();
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const { data: rows, error: cartErr } = await supabase
//         .from('cart')
//         .select('*')
//         .eq('user_id', session.user.id);
//       if (cartErr) throw cartErr;

//       if (!rows?.length) {
//         setError('Your cart is empty.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       setCartItems(rows);
//       localStorage.setItem('cart', JSON.stringify(rows));
//       setCartCount(rows.length);
//       await fetchCartProducts(rows);
//     } catch (err) {
//       console.error('initializeCart:', err);
//       setError(err.message || 'Failed to load cart');
//       toast.error(err.message || 'Failed to load cart', { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, setProducts, setError, setLoading]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   // ---------------------------------------------------------------------------
//   // COMPUTED
//   // ---------------------------------------------------------------------------
//   const total = products.reduce((sum, p) => {
//     const ci = cartItems.find((c) => c.id === p.cartId);
//     if (!ci) return sum;
//     const qty = ci.quantity ?? 1;
//     const price = parseFloat(p.selectedVariant?.price ?? p.price ?? ci.price ?? 0);
//     return sum + price * qty;
//   }, 0);

//   /** Group cart items by seller */
//   const groupCartItemsBySeller = () => {
//     const map = {};
//     cartItems.forEach((ci) => {
//       const prod = products.find((p) => matchProduct(ci, p));
//       if (!prod) return;
//       const seller = prod.seller_id;
//       if (!map[seller]) map[seller] = { items: [], effectiveRadius: prod.deliveryRadius ?? DELIVERY_RADIUS_FALLBACK };
//       const price = parseFloat(prod.selectedVariant?.price ?? prod.price ?? ci.price ?? 0);
//       map[seller].items.push({
//         product_id: ci.product_id,
//         variant_id: ci.variant_id ?? null,
//         quantity: ci.quantity ?? 1,
//         price,
//       });
//     });
//     return map;
//   };

//   /** Insert orders + items */
//   const placeOrdersForAllSellers = async (userId, shipLoc, shipAddr) => {
//     const grouped = groupCartItemsBySeller();
//     const newOrderIds = [];

//     for (const [sellerId, { items, effectiveRadius }] of Object.entries(grouped)) {
//       const { data: sellerData, error: sellerErr } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', sellerId)
//         .single();

//       if (sellerErr) throw sellerErr;

//       const sellerLoc = { lat: sellerData.latitude, lon: sellerData.longitude };
//       const distKm = calculateDistance(shipLoc, sellerLoc);
//       if (distKm === null || distKm > effectiveRadius) {
//         throw new Error(`Seller out of range (${distKm?.toFixed(1)} km)`);
//       }

//       const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
//       const eta = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

//       const { data: orderRow, error: orderErr } = await supabase
//         .from('orders')
//         .insert({
//           user_id: userId,
//           seller_id: sellerId,
//           total: subtotal,
//           order_status: 'pending',
//           payment_method: 'cash_on_delivery',
//           shipping_location: `POINT(${shipLoc.lon} ${shipLoc.lat})`,
//           shipping_address: shipAddr,
//           estimated_delivery: eta.toISOString(),
//         })
//         .select()
//         .single();

//       if (orderErr) throw orderErr;
//       newOrderIds.push(orderRow.id);

//       const { error: itemsErr } = await supabase
//         .from('order_items')
//         .insert(items.map((i) => ({ order_id: orderRow.id, ...i })));
//       if (itemsErr) throw itemsErr;
//     }
//     return newOrderIds;
//   };

//   // ---------------------------------------------------------------------------
//   // ADDRESS VALIDATION
//   // ---------------------------------------------------------------------------
//   const validateAddress = (addr) => {
//     const ok = addr && addr.trim().length >= 10;
//     if (!ok) throw new Error('Address must be at least 10 characters');
//     return true;
//   };

//   const validateManualAddress = (addr) => {
//     try {
//       validateAddress(addr);
//       setAddressError('');
//       return true;
//     } catch (err) {
//       setAddressError(err.message);
//       toast.error(err.message);
//       return false;
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // MAIN CHECKOUT HANDLER
//   // ---------------------------------------------------------------------------
//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (!products.length) return toast.error('Cart is empty');

//     setLoading(true);
//     const originalCart = [...cartItems];

//     try {
//       let {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session?.user || !session?.access_token) {
//         toast.error('Authentication required.');
//         navigate('/auth');
//         return;
//       }

//       const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
//       if (refErr || !refreshed?.session?.access_token) {
//         toast.error('Session expired.');
//         navigate('/auth');
//         return;
//       }

//       session = refreshed.session;

//       const shipLoc = userLocation || DEFAULT_LOCATION;
//       const shipAddr = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(shipAddr);

//       // Delivery radius check
//       for (const p of products) {
//         const { data: sellerLoc, error: sellerErr } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', p.seller_id)
//           .single();
//         if (sellerErr) throw sellerErr;
//         const d = calculateDistance(shipLoc, {
//           lat: sellerLoc.latitude,
//           lon: sellerLoc.longitude,
//         });
//         const radius = p.deliveryRadius || DELIVERY_RADIUS_FALLBACK;
//         if (d === null || d > radius) throw new Error(`${p.title} out of delivery range.`);
//       }

//       const newOrderIds = await placeOrdersForAllSellers(
//         session.user.id,
//         shipLoc,
//         shipAddr
//       );

//       // Empty cart
//       await supabase.from('cart').delete().eq('user_id', session.user.id);
//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.removeItem('cart');

//       setOrderConfirmed(true);
//       toast.success('Order placed successfully');
//       setTimeout(() => navigate('/account', { state: { newOrderIds } }), 1500);
//     } catch (err) {
//       console.error('handleCheckout:', err);
//       setCartItems(originalCart);
//       toast.error(err.message || 'Checkout failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // RENDER
//   // ---------------------------------------------------------------------------
//   const pageUrl = 'https://www.markeet.com/checkout';
//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed – Markeet</title>
//           <meta name="robots" content="noindex" />
//           <link rel="canonical" href={pageUrl} />
//         </Helmet>
//         <h1>Order Confirmed!</h1>
//         <p>Redirecting to your account...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout – Markeet</title>
//         <meta name="robots" content="noindex" />
//         <link rel="canonical" href={pageUrl} />
//       </Helmet>

//       <h1 className="checkout-title">Checkout</h1>

//       {!products.length ? (
//         <p className="empty-checkout">Your cart is empty.</p>
//       ) : (
//         <>
//           {/* ITEMS LIST */}
//           <div className="checkout-items">
//             {products.map((p) => {
//               const cartItem = cartItems.find((ci) => ci.id === p.cartId);
//               if (!cartItem) {
//                 console.warn('No cartItem found for product:', p.id, p.cartId);
//                 toast.error(`Failed to load ${p.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }
//               const qty = cartItem.quantity ?? 1;
//               const price = parseFloat(p.selectedVariant?.price ?? p.price ?? cartItem.price ?? 0);
//               const attrs = p.selectedVariant?.attributes
//                 ? Object.entries(p.selectedVariant.attributes)
//                     .filter(([, v]) => v)
//                     .map(([k, v]) => `${k}: ${v}`)
//                     .join(', ')
//                 : null;
//               return (
//                 <div className="checkout-item" key={`${p.id}-${cartItem.id}`}>
//                   <img
//                     src={p.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${p.title} checkout image`}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for ${p.title}: ${p.images?.[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                     {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       </div>
//                     </div>
//                     <p>Quantity: {qty}</p>
//                     <p>
//                       Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* CHECKOUT DETAILS */}
//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMsg && <p className="location-message">{locationMsg}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Please enter your address below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your full address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment</h3>
//             <p className="payment-method-cod">Pay with Cash on Delivery</p>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place order with Cash on Delivery"
//               >
//                 {loading ? 'Processing...' : 'Place Order'}
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }


// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';

// // -----------------------------------------------------------------------------
// // CONSTANTS
// // -----------------------------------------------------------------------------
// const DEFAULT_IMAGE =
//   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
// const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';
// const DELIVERY_RADIUS_FALLBACK = 40; // km

// // -----------------------------------------------------------------------------
// // HELPER UTILS
// // -----------------------------------------------------------------------------
// /** Simple debounce */
// const debounce = (fn, delay = 500) => {
//   let tId;
//   return (...args) => {
//     clearTimeout(tId);
//     tId = setTimeout(() => fn(...args), delay);
//   };
// };

// /** Haversine distance (km) */
// function calculateDistance(a, b) {
//   if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
//   const R = 6371;
//   const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//   const dLon = ((b.lon - a.lon) * Math.PI) / 180;
//   const sLat = Math.sin(dLat / 2);
//   const sLon = Math.sin(dLon / 2);
//   const h =
//     sLat ** 2 +
//     Math.cos((a.lat * Math.PI) / 180) *
//       Math.cos((b.lat * Math.PI) / 180) *
//       sLon ** 2;
//   return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
// }

// /** Generic retry wrapper */
// const retryRequest = async (fn, maxAttempts = 3, delay = 1000) => {
//   for (let i = 1; i <= maxAttempts; i += 1) {
//     try {
//       return await fn();
//     } catch (err) {
//       if (i === maxAttempts) throw err;
//       console.warn(`Attempt ${i} failed – retrying in ${delay}ms`, err);
//       await new Promise((r) => setTimeout(r, delay));
//       delay *= 2;
//     }
//   }
// };

// const matchProduct = (item, product) =>
//   item.product_id === product.id &&
//   (item.variant_id ?? null) === (product.selectedVariant?.id ?? null);

// // -----------------------------------------------------------------------------
// // COMPONENT
// // -----------------------------------------------------------------------------
// export default function Checkout() {
//   // CONTEXT ------------------------------------------------
//   const { buyerLocation, setCartCount } = useContext(LocationContext);

//   // STATE --------------------------------------------------
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(buyerLocation);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [locationMsg, setLocationMsg] = useState('');

//   // HOOKS --------------------------------------------------
//   const navigate = useNavigate();
//   const {
//     fetchCartProducts,
//     products,
//     loading,
//     error,
//     setLoading,
//     setError,
//     setProducts,
//   } = useFetchCartProducts(userLocation);

//   // ---------------------------------------------------------------------------
//   // EFFECTS / CALLBACKS
//   // ---------------------------------------------------------------------------
//   /** Reverse-geocode helper – debounced */
//   const fetchAddress = useCallback(
//     debounce(async (lat, lon) => {
//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//           { headers: { 'User-Agent': 'Markeet/1.0' } },
//         );
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         const displayName = data.display_name || DEFAULT_ADDRESS;
//         setAddress(displayName);
//         setManualAddress(displayName);
//         setLocationMsg('Address fetched successfully.');
//         toast.success('Address fetched successfully.');
//       } catch (err) {
//         console.error('fetchAddress:', err);
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         setLocationMsg('Unable to fetch address – please enter manually.');
//         toast.error('Failed to fetch address.');
//       }
//     }, 500),
//     [],
//   );

//   /** Detect browser location */
//   const handleDetectLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation not supported by browser.');
//       return;
//     }
//     setLocationMsg('Detecting location…');
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//         setUserLocation(coords);
//         fetchAddress(coords.lat, coords.lon);
//       },
//       (err) => {
//         console.error('geolocation:', err);
//         setLocationMsg('Unable to detect location.');
//         toast.error('Location detection failed.');
//       },
//       { enableHighAccuracy: true, timeout: 10000 },
//     );
//   }, [fetchAddress]);

//   /** Sync context location */
//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setUserLocation(buyerLocation);
//       fetchAddress(buyerLocation.lat, buyerLocation.lon);
//     }
//   }, [buyerLocation, fetchAddress]);

//   /** Fetch cart + products once location is available */
//   const initializeCart = useCallback(async () => {
//     if (!userLocation?.lat || !userLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const {
//         data: { session },
//         error: sessionErr,
//       } = await supabase.auth.getSession();

//       if (sessionErr || !session?.user || !session?.access_token) {
//         console.error('Cart session error:', sessionErr, 'Session:', session);
//         localStorage.removeItem('supabase.auth.token');
//         await supabase.auth.signOut();
//         setError('Please log in to view your cart.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         toast.error('Please log in to checkout.', { duration: 3000 });
//         navigate('/auth');
//         return;
//       }

//       const { data: rows, error: cartErr } = await supabase
//         .from('cart')
//         .select('*')
//         .eq('user_id', session.user.id);
//       if (cartErr) throw cartErr;

//       if (!rows?.length) {
//         setError('Your cart is empty.');
//         setCartItems([]);
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       setCartItems(rows);
//       localStorage.setItem('cart', JSON.stringify(rows));
//       setCartCount(rows.length);
//       await fetchCartProducts(rows);
//     } catch (err) {
//       console.error('initializeCart:', err);
//       setError(err.message || 'Failed to load cart');
//       toast.error(err.message || 'Failed to load cart', { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation, fetchCartProducts, setCartCount, setProducts, setError, setLoading]);

//   useEffect(() => {
//     initializeCart();
//   }, [initializeCart]);

//   // ---------------------------------------------------------------------------
//   // COMPUTED
//   // ---------------------------------------------------------------------------
//   const total = products.reduce((sum, p) => {
//     const ci = cartItems.find((c) => c.id === p.cartId);
//     if (!ci) return sum;
//     const qty = ci.quantity ?? 1;
//     const price = parseFloat(p.selectedVariant?.price ?? p.price ?? ci.price ?? 0);
//     return sum + price * qty;
//   }, 0);

//   /** Group cart items by seller */
//   const groupCartItemsBySeller = () => {
//     const map = {};
//     cartItems.forEach((ci) => {
//       const prod = products.find((p) => matchProduct(ci, p));
//       if (!prod) return;
//       const seller = prod.seller_id;
//       if (!map[seller]) map[seller] = { items: [], effectiveRadius: prod.deliveryRadius ?? DELIVERY_RADIUS_FALLBACK };
//       const price = parseFloat(prod.selectedVariant?.price ?? prod.price ?? ci.price ?? 0);
//       map[seller].items.push({
//         product_id: ci.product_id,
//         variant_id: ci.variant_id ?? null,
//         quantity: ci.quantity ?? 1,
//         price,
//       });
//     });
//     return map;
//   };

//   /** Insert orders + items */
//   const placeOrdersForAllSellers = async (userId, shipLoc, shipAddr) => {
//     const grouped = groupCartItemsBySeller();
//     const newOrderIds = [];

//     for (const [sellerId, { items, effectiveRadius }] of Object.entries(grouped)) {
//       const { data: sellerData, error: sellerErr } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', sellerId)
//         .single();

//       if (sellerErr) throw sellerErr;

//       const sellerLoc = { lat: sellerData.latitude, lon: sellerData.longitude };
//       const distKm = calculateDistance(shipLoc, sellerLoc);
//       if (distKm === null || distKm > effectiveRadius) {
//         throw new Error(`Seller out of range (${distKm?.toFixed(1)} km)`);
//       }

//       const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
//       const eta = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

//       const { data: orderRow, error: orderErr } = await supabase
//         .from('orders')
//         .insert({
//           user_id: userId,
//           seller_id: sellerId,
//           total: subtotal,
//           order_status: 'pending',
//           payment_method: 'cash_on_delivery',
//           shipping_location: `POINT(${shipLoc.lon} ${shipLoc.lat})`,
//           shipping_address: shipAddr,
//           estimated_delivery: eta.toISOString(),
//         })
//         .select()
//         .single();

//       if (orderErr) throw orderErr;
//       newOrderIds.push(orderRow.id);

//       const { error: itemsErr } = await supabase
//         .from('order_items')
//         .insert(items.map((i) => ({ order_id: orderRow.id, ...i })));
//       if (itemsErr) throw itemsErr;
//     }
//     return newOrderIds;
//   };

//   // ---------------------------------------------------------------------------
//   // ADDRESS VALIDATION
//   // ---------------------------------------------------------------------------
//   const validateAddress = (addr) => {
//     const ok = addr && addr.trim().length >= 10;
//     if (!ok) throw new Error('Address must be at least 10 characters');
//     return true;
//   };

//   const validateManualAddress = (addr) => {
//     try {
//       validateAddress(addr);
//       setAddressError('');
//       return true;
//     } catch (err) {
//       setAddressError(err.message);
//       toast.error(err.message);
//       return false;
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // MAIN CHECKOUT HANDLER
//   // ---------------------------------------------------------------------------
//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     if (!products.length) return toast.error('Cart is empty');

//     setLoading(true);
//     const originalCart = [...cartItems];

//     try {
//       let {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!session?.user || !session?.access_token) {
//         toast.error('Authentication required.');
//         navigate('/auth');
//         return;
//       }

//       const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
//       if (refErr || !refreshed?.session?.access_token) {
//         toast.error('Session expired.');
//         navigate('/auth');
//         return;
//       }

//       session = refreshed.session;

//       const shipLoc = userLocation || DEFAULT_LOCATION;
//       const shipAddr = manualAddress || address || DEFAULT_ADDRESS;
//       validateAddress(shipAddr);

//       // Delivery radius check
//       for (const p of products) {
//         const { data: sellerLoc, error: sellerErr } = await supabase
//           .from('sellers')
//           .select('latitude, longitude')
//           .eq('id', p.seller_id)
//           .single();
//         if (sellerErr) throw sellerErr;
//         const d = calculateDistance(shipLoc, {
//           lat: sellerLoc.latitude,
//           lon: sellerLoc.longitude,
//         });
//         const radius = p.deliveryRadius || DELIVERY_RADIUS_FALLBACK;
//         if (d === null || d > radius) throw new Error(`${p.title} out of delivery range.`);
//       }

//       const newOrderIds = await placeOrdersForAllSellers(
//         session.user.id,
//         shipLoc,
//         shipAddr
//       );

//       // Empty cart
//       await supabase.from('cart').delete().eq('user_id', session.user.id);
//       setCartItems([]);
//       setProducts([]);
//       setCartCount(0);
//       localStorage.removeItem('cart');

//       setOrderConfirmed(true);
//       toast.success("Don't worry, we're on our way with your delivery in no time!", { duration: 5000 });
//       setTimeout(() => navigate('/account', { state: { newOrderIds } }), 5000);
//     } catch (err) {
//       console.error('handleCheckout:', err);
//       setCartItems(originalCart);
//       toast.error(err.message || 'Checkout failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------------------------------------------------------------------
//   // RENDER
//   // ---------------------------------------------------------------------------
//   const pageUrl = 'https://www.markeet.com/checkout';
//   if (loading) return <div className="checkout-loading">Loading...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;

//   if (orderConfirmed) {
//     return (
//       <div className="checkout-success">
//         <Helmet>
//           <title>Order Confirmed – Markeet</title>
//           <meta name="robots" content="noindex" />
//           <link rel="canonical" href={pageUrl} />
//         </Helmet>
//         <h1>Order Confirmed!</h1>
//         <p>Don't worry, we're on our way with your delivery in no time!</p>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout">
//       <Helmet>
//         <title>Checkout – Markeet</title>
//         <meta name="robots" content="noindex" />
//         <link rel="canonical" href={pageUrl} />
//       </Helmet>

//       <h1 className="checkout-title">Checkout</h1>

//       {!products.length ? (
//         <p className="empty-checkout">Your cart is empty.</p>
//       ) : (
//         <>
//           {/* ITEMS LIST */}
//           <div className="checkout-items">
//             {products.map((p) => {
//               const cartItem = cartItems.find((ci) => ci.id === p.cartId);
//               if (!cartItem) {
//                 console.warn('No cartItem found for product:', p.id, p.cartId);
//                 toast.error(`Failed to load ${p.title || 'product'}.`, { duration: 3000 });
//                 return null;
//               }
//               const qty = cartItem.quantity ?? 1;
//               const price = parseFloat(p.selectedVariant?.price ?? p.price ?? cartItem.price ?? 0);
//               const attrs = p.selectedVariant?.attributes
//                 ? Object.entries(p.selectedVariant.attributes)
//                     .filter(([, v]) => v)
//                     .map(([k, v]) => `${k}: ${v}`)
//                     .join(', ')
//                 : null;
//               return (
//                 <div className="checkout-item" key={`${p.id}-${cartItem.id}`}>
//                   <img
//                     src={p.images?.[0] || DEFAULT_IMAGE}
//                     alt={`${p.title} checkout image`}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for ${p.title}: ${p.images?.[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     className="checkout-item-image"
//                   />
//                   <div className="checkout-item-details">
//                     <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                     {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                     <div className="checkout-item-price-section">
//                       <div className="price-container">
//                         <span className="checkout-item-final-price">
//                           ₹{price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       </div>
//                     </div>
//                     <p>Quantity: {qty}</p>
//                     <p>
//                       Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* CHECKOUT DETAILS */}
//           <div className="checkout-details">
//             <h2 className="checkout-summary-title">Order Summary</h2>
//             <p className="checkout-total">
//               Total: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </p>

//             <h3 className="checkout-section-title">Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
//             {locationMsg && <p className="location-message">{locationMsg}</p>}
//             {userLocation && address ? (
//               <p className="detected-address">
//                 Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//                 {userLocation.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p className="no-address">Please enter your address below.</p>
//             )}
//             <label htmlFor="shipping-address" className="address-label">
//               Shipping Address
//             </label>
//             <textarea
//               id="shipping-address"
//               value={manualAddress}
//               onChange={(e) => {
//                 setManualAddress(e.target.value);
//                 validateManualAddress(e.target.value);
//               }}
//               placeholder="Enter your full address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             <h3 className="checkout-section-title">Payment</h3>
//             <p className="payment-method-cod">Pay with Cash on Delivery</p>
//             <p className="payment-method-info">
//               At delivery time, you can also pay online if preferred.
//             </p>

//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place order with Cash on Delivery"
//               >
//                 {loading ? 'Processing...' : 'Place Order'}
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }


import React, { useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
import '../style/Checkout.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------
const DEFAULT_IMAGE =
  'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 };
const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
const DELIVERY_RADIUS_FALLBACK = 40; // km

// -----------------------------------------------------------------------------
// HELPER UTILS
// -----------------------------------------------------------------------------
/** Simple debounce */
const debounce = (fn, delay = 500) => {
  let tId;
  return (...args) => {
    clearTimeout(tId);
    tId = setTimeout(() => fn(...args), delay);
  };
};

/** Haversine distance (km) */
function calculateDistance(a, b) {
  if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sLat = Math.sin(dLat / 2);
  const sLon = Math.sin(dLon / 2);
  const h =
    sLat ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sLon ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Generic retry wrapper */
const retryRequest = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

const matchProduct = (item, product) =>
  item.product_id === product.id &&
  (item.variant_id ?? null) === (product.selectedVariant?.id ?? null);

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
export default function Checkout() {
  // CONTEXT ------------------------------------------------
  const { buyerLocation, setCartCount } = useContext(LocationContext);

  // STATE --------------------------------------------------
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(buyerLocation);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [locationMsg, setLocationMsg] = useState('');

  // HOOKS --------------------------------------------------
  const navigate = useNavigate();
  const {
    fetchCartProducts,
    products,
    loading,
    error,
    setLoading,
    setError,
    setProducts,
  } = useFetchCartProducts(userLocation);

  // ---------------------------------------------------------------------------
  // EFFECTS / CALLBACKS
  // ---------------------------------------------------------------------------
  /** Reverse-geocode helper – debounced */
  const fetchAddress = useCallback(
    debounce(async (lat, lon) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'Markeet/1.0' } },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const displayName = data.display_name || DEFAULT_ADDRESS;
        setAddress(displayName);
        setManualAddress(displayName);
        setLocationMsg('Address fetched successfully.');
        toast.success('Address fetched successfully.');
      } catch (err) {
        setAddress(DEFAULT_ADDRESS);
        setManualAddress(DEFAULT_ADDRESS);
        setLocationMsg('Unable to fetch address – please enter manually.');
        toast.error('Failed to fetch address.');
      }
    }, 500),
    [],
  );

  /** Detect browser location */
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by browser.');
      return;
    }
    setLocationMsg('Detecting location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(coords);
        fetchAddress(coords.lat, coords.lon);
      },
      () => {
        setLocationMsg('Unable to detect location.');
        toast.error('Location detection failed.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [fetchAddress]);

  /** Sync context location */
  useEffect(() => {
    if (buyerLocation?.lat && buyerLocation?.lon) {
      setUserLocation(buyerLocation);
      fetchAddress(buyerLocation.lat, buyerLocation.lon);
    }
  }, [buyerLocation, fetchAddress]);

  /** Fetch cart + products once location is available */
  const initializeCart = useCallback(async () => {
    if (!userLocation?.lat || !userLocation?.lon) {
      setError('Location data unavailable. Please set your location.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !session?.user || !session?.access_token) {
        localStorage.removeItem('supabase.auth.token');
        await supabase.auth.signOut();
        setError('Please log in to view your cart.');
        setCartItems([]);
        setProducts([]);
        setCartCount(0);
        localStorage.setItem('cart', JSON.stringify([]));
        toast.error('Please log in to checkout.', { duration: 3000 });
        navigate('/auth');
        return;
      }

      const { data: rows, error: cartErr } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', session.user.id);
      if (cartErr) throw cartErr;

      if (!rows?.length) {
        setError('Your cart is empty.');
        setCartItems([]);
        setProducts([]);
        setCartCount(0);
        localStorage.setItem('cart', JSON.stringify([]));
        return;
      }

      setCartItems(rows);
      localStorage.setItem('cart', JSON.stringify(rows));
      setCartCount(rows.length);
      await fetchCartProducts(rows);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
      toast.error(err.message || 'Failed to load cart', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [userLocation, fetchCartProducts, setCartCount, setProducts, setError, setLoading]);

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------
  const total = products.reduce((sum, p) => {
    const ci = cartItems.find((c) => c.id === p.cartId);
    if (!ci) return sum;
    const qty = ci.quantity ?? 1;
    const price = parseFloat(p.selectedVariant?.price ?? p.price ?? ci.price ?? 0);
    return sum + price * qty;
  }, 0);

  /** Group cart items by seller */
  const groupCartItemsBySeller = () => {
    const map = {};
    cartItems.forEach((ci) => {
      const prod = products.find((p) => matchProduct(ci, p));
      if (!prod) return;
      const seller = prod.seller_id;
      if (!map[seller]) map[seller] = { items: [], effectiveRadius: prod.deliveryRadius ?? DELIVERY_RADIUS_FALLBACK };
      const price = parseFloat(prod.selectedVariant?.price ?? prod.price ?? ci.price ?? 0);
      map[seller].items.push({
        product_id: ci.product_id,
        variant_id: ci.variant_id ?? null,
        quantity: ci.quantity ?? 1,
        price,
      });
    });
    return map;
  };

  /** Insert orders + items */
  const placeOrdersForAllSellers = async (userId, shipLoc, shipAddr) => {
    const grouped = groupCartItemsBySeller();
    const newOrderIds = [];

    for (const [sellerId, { items, effectiveRadius }] of Object.entries(grouped)) {
      const { data: sellerData, error: sellerErr } = await supabase
        .from('sellers')
        .select('latitude, longitude')
        .eq('id', sellerId)
        .single();

      if (sellerErr) throw sellerErr;

      const sellerLoc = { lat: sellerData.latitude, lon: sellerData.longitude };
      const distKm = calculateDistance(shipLoc, sellerLoc);
      if (distKm === null || distKm > effectiveRadius) {
        throw new Error(`Seller out of range (${distKm?.toFixed(1)} km)`);
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const eta = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          seller_id: sellerId,
          total: subtotal,
          order_status: 'pending',
          payment_method: 'cash_on_delivery',
          shipping_location: `POINT(${shipLoc.lon} ${shipLoc.lat})`,
          shipping_address: shipAddr,
          estimated_delivery: eta.toISOString(),
        })
        .select()
        .single();

      if (orderErr) throw orderErr;
      newOrderIds.push(orderRow.id);

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(items.map((i) => ({ order_id: orderRow.id, ...i })));
      if (itemsErr) throw itemsErr;
    }
    return newOrderIds;
  };

  // ---------------------------------------------------------------------------
  // ADDRESS VALIDATION
  // ---------------------------------------------------------------------------
  const validateAddress = (addr) => {
    const ok = addr && addr.trim().length >= 10;
    if (!ok) throw new Error('Address must be at least 10 characters');
    return true;
  };

  const validateManualAddress = (addr) => {
    try {
      validateAddress(addr);
      setAddressError('');
      return true;
    } catch (err) {
      setAddressError(err.message);
      toast.error(err.message);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // MAIN CHECKOUT HANDLER
  // ---------------------------------------------------------------------------
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!products.length) return toast.error('Cart is empty');

    setLoading(true);
    const originalCart = [...cartItems];

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !session?.access_token) {
        toast.error('Authentication required.');
        navigate('/auth');
        return;
      }

      const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
      if (refErr || !refreshed?.session?.access_token) {
        toast.error('Session expired.');
        navigate('/auth');
        return;
      }

      session = refreshed.session;

      const shipLoc = userLocation || DEFAULT_LOCATION;
      const shipAddr = manualAddress || address || DEFAULT_ADDRESS;
      validateAddress(shipAddr);

      // Delivery radius check
      for (const p of products) {
        const { data: sellerLoc, error: sellerErr } = await supabase
          .from('sellers')
          .select('latitude, longitude')
          .eq('id', p.seller_id)
          .single();
        if (sellerErr) throw sellerErr;
        const d = calculateDistance(shipLoc, {
          lat: sellerLoc.latitude,
          lon: sellerLoc.longitude,
        });
        const radius = p.deliveryRadius || DELIVERY_RADIUS_FALLBACK;
        if (d === null || d > radius) throw new Error(`${p.title} out of delivery range.`);
      }

      const newOrderIds = await placeOrdersForAllSellers(
        session.user.id,
        shipLoc,
        shipAddr
      );

      // Empty cart
      await supabase.from('cart').delete().eq('user_id', session.user.id);
      setCartItems([]);
      setProducts([]);
      setCartCount(0);
      localStorage.removeItem('cart');

      setOrderConfirmed(true);
      toast.success("Don't worry, we're on our way with your delivery in no time!", { duration: 5000 });
      setTimeout(() => navigate('/account', { state: { newOrderIds } }), 5000);
    } catch (err) {
      setCartItems(originalCart);
      toast.error(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  const pageUrl = 'https://www.markeet.com/checkout';
  if (loading) return <div className="checkout-loading">Loading...</div>;
  if (error) return <div className="checkout-error">{error}</div>;

  if (orderConfirmed) {
    return (
      <div className="checkout-success">
        <Helmet>
          <title>Order Confirmed – Markeet</title>
          <meta name="robots" content="noindex" />
          <link rel="canonical" href={pageUrl} />
        </Helmet>
        <h1>Order Confirmed!</h1>
        <p>Don't worry, we're on our way with your delivery in no time!</p>
      </div>
    );
  }

  return (
    <div className="checkout">
      <Helmet>
        <title>Checkout – Markeet</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <h1 className="checkout-title">Checkout</h1>

      {!products.length ? (
        <p className="empty-checkout">Your cart is empty.</p>
      ) : (
        <>
          {/* ITEMS LIST */}
          <div className="checkout-items">
            {products.map((p) => {
              const cartItem = cartItems.find((ci) => ci.id === p.cartId);
              if (!cartItem) {
                toast.error(`Failed to load ${p.title || 'product'}.`, { duration: 3000 });
                return null;
              }
              const qty = cartItem.quantity ?? 1;
              const price = parseFloat(p.selectedVariant?.price ?? p.price ?? cartItem.price ?? 0);
              const attrs = p.selectedVariant?.attributes
                ? Object.entries(p.selectedVariant.attributes)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')
                : null;
              return (
                <div className="checkout-item" key={`${p.id}-${cartItem.id}`}>
                  <img
                    src={p.images?.[0] || DEFAULT_IMAGE}
                    alt={`${p.title} checkout image`}
                    onError={(e) => {
                      e.target.src = DEFAULT_IMAGE;
                    }}
                    className="checkout-item-image"
                  />
                  <div className="checkout-item-details">
                    <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
                    {attrs && <p className="variant-info">Variant: {attrs}</p>}
                    <div className="checkout-item-price-section">
                      <div className="price-container">
                        <span className="checkout-item-final-price">
                          ₹{price.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <p>Quantity: {qty}</p>
                    <p>
                      Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHECKOUT DETAILS */}
          <div className="checkout-details">
            <h2 className="checkout-summary-title">Order Summary</h2>
            <p className="checkout-total">
              Total: ₹{total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <h3 className="checkout-section-title">Shipping Address</h3>
            <button
              onClick={handleDetectLocation}
              className="detect-location-btn"
              disabled={loading}
              aria-label="Detect my current location"
            >
              Detect My Location
            </button>
            {locationMsg && <p className="location-message">{locationMsg}</p>}
            {userLocation && address ? (
              <p className="detected-address">
                Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
                {userLocation.lon.toFixed(4)})
              </p>
            ) : (
              <p className="no-address">Please enter your address below.</p>
            )}
            <label htmlFor="shipping-address" className="address-label">
              Shipping Address
            </label>
            <textarea
              id="shipping-address"
              value={manualAddress}
              onChange={(e) => {
                setManualAddress(e.target.value);
                validateManualAddress(e.target.value);
              }}
              placeholder="Enter your full address (e.g., 123 Main St, Jharia, Dhanbad, Jharkhand, India)"
              rows="4"
              className="address-textarea"
              aria-label="Enter shipping address"
            />
            {addressError && <p className="address-error">{addressError}</p>}

            <h3 className="checkout-section-title">Payment</h3>
            <p className="payment-method-cod">Pay with Cash on Delivery</p>
            <p className="payment-method-info">
              At delivery time, you can also pay online if preferred.
            </p>

            <div className="checkout-action">
              <button
                onClick={handleCheckout}
                className="place-order-btn"
                disabled={loading || addressError || products.length === 0 || total <= 0}
                aria-label="Place order with Cash on Delivery"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}