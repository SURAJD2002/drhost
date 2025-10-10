// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
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
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay'); // Default to Razorpay
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [customerDetails, setCustomerDetails] = useState({
//     name: '',
//     email: '',
//     contact: ''
//   });
  
//   const { fetchCartProducts, products, loading, error, setLoading, setError, setProducts } =
//     useFetchCartProducts(userLocation);
//   const { initiatePayment, loading: razorpayLoading } = useRazorpayPayment();
//   const navigate = useNavigate();

//   // Debug: Log environment variables
//   console.log('🔍 Checkout Component Debug:');
//   console.log('Razorpay Key ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
//   console.log('Payment Method:', paymentMethod);
//   console.log('Customer Details:', customerDetails);
//   console.log('Products:', products);
//   console.log('Cart Items:', cartItems);
//   console.log('Loading:', loading);
//   console.log('User Location:', userLocation);
//   console.log('Session User ID:', session?.user?.id);
//   console.log('Session:', session);

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

//       return `${city}, ${data.address.state || 'Unknown State'} ${postalCode}, ${data.address.country || 'India'}`;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   };

//   const handleDetectLocation = async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const position = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 300000,
//         });
//       });

//       const { latitude, longitude } = position.coords;
//       const newLocation = { lat: latitude, lon: longitude };
      
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);
      
//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         toast.success('Location detected successfully!');
//       } else {
//         toast.error('Could not detect address from coordinates.');
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error('Location access denied. Please enable location permissions.');
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again.');
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.');
//       } else {
//         toast.error('Failed to detect location. Please enter manually.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validateManualAddress = useCallback(
//     debounce((address) => {
//       if (!address || address.trim().length < 10) {
//         setAddressError('Please enter a complete address (at least 10 characters)');
//       } else if (address.trim().length > 500) {
//         setAddressError('Address is too long. Please keep it under 500 characters.');
//       } else {
//         setAddressError('');
//       }
//     }, 500),
//     []
//   );

//   const handleApplyEMI = () => {
//     setShowEMIModal(true);
//   };

//   // Handle Razorpay payment
//   const handleRazorpayPayment = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with payment');
//       navigate('/auth');
//       return;
//     }

//     if (!validateCustomerDetails()) {
//       return;
//     }

//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     try {
//       // Calculate total amount in paise
//       const totalAmount = products.reduce((sum, product) => {
//         const price = product.selectedVariant?.price || product.price;
//         const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//         return sum + (price * qty);
//       }, 0);

//       // Validate total amount
//       if (!totalAmount || totalAmount <= 0) {
//         toast.error('Invalid order amount. Please check your cart.');
//         return;
//       }

//       // Prepare order data for Razorpay
//       const orderData = {
//         amount: Math.round(totalAmount * 100), // Convert to paise and ensure it's an integer
//         currency: 'INR',
//         user_id: session?.user?.id, // Add user ID from session
//         products: products.map(product => ({
//           id: product.id,
//           name: product.title || product.name,
//           price: product.selectedVariant?.price || product.price,
//           quantity: cartItems.find(item => item.id === product.id)?.qty || 1
//         })),
//         customer_details: customerDetails,
//         shipping_address: manualAddress,
//         metadata: {
//           source: 'react_web_app',
//           timestamp: new Date().toISOString(),
//         },
//       };

//       console.log('🔍 Order data prepared:', orderData);

//       // Prepare checkout options (order_id will be added by initiatePayment)
//       const checkoutOptions = {
//         key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: 'INR',
//         name: 'FreshCart', // Replace with your actual company name
//         description: `Order for ${products.length} product(s)`,
//         prefill: customerDetails,
//         theme: {
//           color: '#3399cc',
//         },
//       };

//       console.log('🔍 Initiating Razorpay payment with:', { orderData, checkoutOptions });
      
//       // Initiate Razorpay payment
//       await initiatePayment({
//         orderData,
//         checkoutOptions,
//       });

//     } catch (error) {
//       console.error('Razorpay payment failed:', error);
//       toast.error(`Payment failed: ${error.message}`);
//     }
//   };

//   // Handle traditional checkout (Cash on Delivery)
//   const handleTraditionalCheckout = async () => {
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Your existing checkout logic for Cash on Delivery
//       // This would create orders in your database
//       toast.success('Order placed successfully with Cash on Delivery!');
//       // Clear cart and redirect
//       localStorage.removeItem('cart');
//       navigate('/orders');
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error('Failed to place order. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Validate customer details
//   const validateCustomerDetails = () => {
//     if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
//       toast.error('Please fill in all customer details');
//       return false;
//     }
    
//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(customerDetails.email)) {
//       toast.error('Please enter a valid email address');
//       return false;
//     }
    
//     // Basic phone validation (Indian format)
//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
//       toast.error('Please enter a valid phone number');
//       return false;
//     }
    
//     return true;
//   };

//   // Main checkout handler
//   const handleCheckout = () => {
//     if (paymentMethod === 'razorpay') {
//       handleRazorpayPayment();
//     } else {
//       handleTraditionalCheckout();
//     }
//   };

//   // Calculate total
//   const total = products.reduce((sum, product) => {
//     const price = product.selectedVariant?.price || product.price;
//     const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//     return sum + (price * qty);
//   }, 0);

//   if (loading && products.length === 0) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>🔄 Loading your checkout...</p>
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="empty-cart-container">
//         <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
//         <h2>Your cart is empty</h2>
//         <p>Add some amazing products to your cart to proceed with checkout.</p>
//         <button onClick={() => navigate('/')} className="continue-shopping-btn">
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - FreshCart</title>
//         <meta name="description" content="Complete your purchase securely" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with confidence</p>
//       </div>

//       {!orderConfirmed ? (
//         <>
//           {/* CART ITEMS */}
//           <div className="cart-items-section">
//             <h2 className="cart-items-title">Items in Cart</h2>
//             <div className="cart-items-list">
//               {products.map((p) => {
//                 const qty = cartItems.find((item) => item.id === p.id)?.qty || 1;
//                 const price = p.selectedVariant?.price || p.price;
//                 const attrs = p.selectedVariant?.attributes
//                   ? Object.entries(p.selectedVariant.attributes)
//                       .map(([key, value]) => `${key}: ${value}`)
//                       .join(', ')
//                   : null;

//                 return (
//                   <div key={p.id} className="checkout-item">
//                     <img
//                       src={p.images?.[0] || DEFAULT_IMAGE}
//                       alt={`${p.title}`}
//                       onError={(e) => {
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                       className="checkout-item-image"
//                     />
//                     <div className="checkout-item-details">
//                       <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                       {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                       <div className="checkout-item-price-section">
//                         <div className="price-container">
//                           <span className="checkout-item-final-price">
//                             ₹{price.toLocaleString('en-IN', {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             })}
//                           </span>
//                         </div>
//                       </div>
//                       <p>Quantity: {qty}</p>
//                       <p>
//                         Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
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

//             <h3 className="checkout-section-title">📍 Shipping Address</h3>
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               Detect My Location
//             </button>
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
//               placeholder="Enter your full address (e.g., 123 Main St, Jharia, Dhanbad, Jharkhand, India)"
//               rows="4"
//               className="address-textarea"
//               aria-label="Enter shipping address"
//             />
//             {addressError && <p className="address-error">{addressError}</p>}

//             {/* Customer Details Section */}
//             <h3 className="checkout-section-title">👤 Customer Details</h3>
//             <div className="customer-details-form">
//               <div className="form-row">
//                 <div className="form-group">
//                   <label htmlFor="customer-name">Full Name *</label>
//                   <input
//                     type="text"
//                     id="customer-name"
//                     value={customerDetails.name}
//                     onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter your full name"
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label htmlFor="customer-email">Email Address *</label>
//                   <input
//                     type="email"
//                     id="customer-email"
//                     value={customerDetails.email}
//                     onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
//                     placeholder="Enter your email"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label htmlFor="customer-phone">Phone Number *</label>
//                 <input
//                   type="tel"
//                   id="customer-phone"
//                   value={customerDetails.contact}
//                   onChange={(e) => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
//                   placeholder="Enter your phone number"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Payment Method Section */}
//             <h3 className="checkout-section-title">💳 Payment Method</h3>
            
//             {/* Debug Info - Remove in production */}
//             {process.env.NODE_ENV === 'development' && (
//               <div style={{ 
//                 backgroundColor: '#f0f9ff', 
//                 padding: '10px', 
//                 marginBottom: '15px', 
//                 borderRadius: '6px',
//                 fontSize: '12px',
//                 border: '1px solid #bae6fd'
//               }}>
//                 <strong>Debug Info:</strong><br />
//                 Razorpay Key: {process.env.REACT_APP_RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing'}<br />
//                 Payment Method: {paymentMethod}<br />
//                 Customer Name: {customerDetails.name || 'Not filled'}
//               </div>
//             )}
            
//             <div className="payment-method-selection">
//               <select
//                 value={paymentMethod}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//                 className="payment-method-select"
//               >
//                 <option value="razorpay">💳 Razorpay (Cards, UPI, Net Banking)</option>
//                 <option value="cash_on_delivery">💵 Cash on Delivery</option>
//               </select>
              
//               {paymentMethod === 'razorpay' && (
//                 <div className="razorpay-info">
//                   <p>🔒 Secure payment gateway supporting:</p>
//                   <ul>
//                     <li>Credit/Debit Cards</li>
//                     <li>UPI (Google Pay, PhonePe, Paytm)</li>
//                     <li>Net Banking</li>
//                     <li>Wallets</li>
//                   </ul>
//                 </div>
//               )}
              
//               {paymentMethod === 'cash_on_delivery' && (
//                 <div className="cod-info">
//                   <p>💵 Pay when you receive your order</p>
//                   <p>Available for orders above ₹500</p>
//                 </div>
//               )}
//             </div>

//             {/* EMI Option */}
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

//             {/* Checkout Action */}
//             <div className="checkout-action">
//               <button
//                 onClick={handleCheckout}
//                 className="place-order-btn"
//                 disabled={loading || razorpayLoading || addressError || products.length === 0 || total <= 0}
//                 aria-label="Place order"
//               >
//                 {loading || razorpayLoading ? '⏳ Processing...' : 
//                   paymentMethod === 'razorpay' ? '🚀 Proceed to Secure Payment' : '💵 Place Order (Cash on Delivery)'}
//               </button>
//             </div>
//           </div>

//           {showEMIModal && (
//             <ApplyEMI
//               productId={products[0]?.id}
//               productName={products[0]?.title || products[0]?.name}
//               productPrice={total}
//               sellerId={products[0]?.seller_id}
//               onClose={() => setShowEMIModal(false)}
//             />
//           )}
//         </>
//       ) : (
//         <div className="order-confirmed slide-up">
//           <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
//           <h2>Order Confirmed Successfully!</h2>
//           <p>Your order has been placed and is being processed. You'll receive a confirmation email shortly.</p>
//           <button onClick={() => navigate('/orders')} className="view-orders-btn">
//             📋 View My Orders
//           </button>
//         </div>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout; 


// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
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

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay'); // Default to Razorpay
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [loading, setLoading] = useState(false); // Added local loading state
//   const [customerDetails, setCustomerDetails] = useState({
//     name: '',
//     email: '',
//     contact: ''
//   });
  
//   const { fetchCartProducts, products, loading: fetchLoading } = useFetchCartProducts(userLocation);
//   const { initiatePayment, loading: razorpayLoading } = useRazorpayPayment();
//   const navigate = useNavigate();

//   // Debug: Log environment variables
//   console.log('🔍 Checkout Component Debug:');
//   console.log('Razorpay Key ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
//   console.log('Payment Method:', paymentMethod);
//   console.log('Customer Details:', customerDetails);
//   console.log('Products:', products);
//   console.log('Cart Items:', cartItems);
//   console.log('Loading:', loading);
//   console.log('User Location:', userLocation);
//   console.log('Session User ID:', session?.user?.id);
//   console.log('Session:', session);

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
//       toast.error('Unable to detect location from context; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts]);

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

//       return `${city}, ${data.address.state || 'Unknown State'} ${postalCode}, ${data.address.country || 'India'}`;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   };

//   const handleDetectLocation = async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.');
//       return;
//     }

//     setLoading(true); // Use local setLoading
//     try {
//       const position = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 300000,
//         });
//       });

//       const { latitude, longitude } = position.coords;
//       const newLocation = { lat: latitude, lon: longitude };
      
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);
      
//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         toast.success('Location detected successfully!');
//       } else {
//         toast.error('Could not detect address from coordinates.');
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error('Location access denied. Please enable location permissions.');
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again.');
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.');
//       } else {
//         toast.error('Failed to detect location. Please enter manually.');
//       }
//     } finally {
//       setLoading(false); // Use local setLoading
//     }
//   };

//   const validateManualAddress = useCallback(
//     (address) => {
//       if (!address || address.trim().length < 10) {
//         setAddressError('Please enter a complete address (at least 10 characters)');
//       } else if (address.trim().length > 500) {
//         setAddressError('Address is too long. Please keep it under 500 characters.');
//       } else {
//         setAddressError('');
//       }
//     },
//     [setAddressError]
//   );

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const debouncedValidateManualAddress = useCallback(
//     debounce(validateManualAddress, 500),
//     [validateManualAddress]
//   );

//   const handleApplyEMI = () => {
//     setShowEMIModal(true);
//   };

//   // Handle Razorpay payment
//   const handleRazorpayPayment = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with payment');
//       navigate('/auth');
//       return;
//     }

//     if (!validateCustomerDetails()) {
//       return;
//     }

//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     try {
//       // Calculate total amount in paise
//       const totalAmount = products.reduce((sum, product) => {
//         const price = product.selectedVariant?.price || product.price;
//         const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//         return sum + (price * qty);
//       }, 0);

//       // Validate total amount
//       if (!totalAmount || totalAmount <= 0) {
//         toast.error('Invalid order amount. Please check your cart.');
//         return;
//       }

//       // Prepare order data for Razorpay
//       const orderData = {
//         amount: Math.round(totalAmount * 100), // Convert to paise and ensure it's an integer
//         currency: 'INR',
//         user_id: session?.user?.id,
//         products: products.map(product => ({
//           id: product.id,
//           name: product.title || product.name,
//           price: product.selectedVariant?.price || product.price,
//           quantity: cartItems.find(item => item.id === product.id)?.qty || 1
//         })),
//         customer_details: customerDetails,
//         shipping_address: manualAddress,
//         metadata: {
//           source: 'react_web_app',
//           timestamp: new Date().toISOString(),
//         },
//       };

//       console.log('🔍 Order data prepared:', orderData);

//       // Prepare checkout options
//       const checkoutOptions = {
//         key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: 'INR',
//         name: 'FreshCart',
//         description: `Order for ${products.length} product(s)`,
//         prefill: customerDetails,
//         theme: {
//           color: '#3399cc',
//         },
//       };

//       console.log('🔍 Initiating Razorpay payment with:', { orderData, checkoutOptions });
      
//       // Initiate Razorpay payment
//       await initiatePayment({
//         orderData,
//         checkoutOptions,
//       });

//     } catch (error) {
//       console.error('Razorpay payment failed:', error);
//       toast.error(`Payment failed: ${error.message}`);
//     }
//   };

//   // Handle traditional checkout (Cash on Delivery)
//   const handleTraditionalCheckout = async () => {
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     setLoading(true); // Use local setLoading
//     try {
//       // Placeholder for checkout logic (e.g., API call to create order)
//       toast.success('Order placed successfully with Cash on Delivery!');
//       localStorage.removeItem('cart');
//       navigate('/orders');
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error('Failed to place order. Please try again.');
//     } finally {
//       setLoading(false); // Use local setLoading
//     }
//   };

//   // Validate customer details
//   const validateCustomerDetails = () => {
//     if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
//       toast.error('Please fill in all customer details');
//       return false;
//     }
    
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(customerDetails.email)) {
//       toast.error('Please enter a valid email address');
//       return false;
//     }
    
//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
//       toast.error('Please enter a valid phone number');
//       return false;
//     }
    
//     return true;
//   };

//   // Main checkout handler
//   const handleCheckout = () => {
//     if (paymentMethod === 'razorpay') {
//       handleRazorpayPayment();
//     } else {
//       handleTraditionalCheckout();
//     }
//   };

//   // Calculate total
//   const total = products.reduce((sum, product) => {
//     const price = product.selectedVariant?.price || product.price;
//     const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//     return sum + (price * qty);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>🔄 Loading your checkout...</p>
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="empty-cart-container">
//         <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
//         <h2>Your cart is empty</h2>
//         <p>Add some amazing products to your cart to proceed with checkout.</p>
//         <button onClick={() => navigate('/')} className="continue-shopping-btn">
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - FreshCart</title>
//         <meta name="description" content="Complete your purchase securely" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with confidence</p>
//       </div>

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const qty = cartItems.find((item) => item.id === p.id)?.qty || 1;
//             const price = p.selectedVariant?.price || p.price;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([key, value]) => `${key}: ${value}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={p.id} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={`${p.title}`}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                 />
//                 <div className="checkout-item-details">
//                   <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                   {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                   <div className="checkout-item-price-section">
//                     <div className="price-container">
//                       <span className="checkout-item-final-price">
//                         ₹{price.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                     </div>
//                   </div>
//                   <p>Quantity: {qty}</p>
//                   <p>
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <div className="checkout-details">
//         <h2 className="checkout-summary-title">Order Summary</h2>
//         <p className="checkout-total">
//           Total: ₹{total.toLocaleString('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}
//         </p>

//         <h3 className="checkout-section-title">📍 Shipping Address</h3>
//         <button
//           onClick={handleDetectLocation}
//           className="detect-location-btn"
//           disabled={loading}
//           aria-label="Detect my current location"
//         >
//           Detect My Location
//         </button>
//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon{' '}
//             {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below.</p>
//         )}
//         <label htmlFor="shipping-address" className="address-label">
//           Shipping Address
//         </label>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={(e) => {
//             setManualAddress(e.target.value);
//             debouncedValidateManualAddress(e.target.value);
//           }}
//           placeholder="Enter your full address (e.g., 123 Main St, Jharia, Dhanbad, Jharkhand, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//         />
//         {addressError && <p className="address-error">{addressError}</p>}

//         <h3 className="checkout-section-title">👤 Customer Details</h3>
//         <div className="customer-details-form">
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="customer-name">Full Name *</label>
//               <input
//                 type="text"
//                 id="customer-name"
//                 value={customerDetails.name}
//                 onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
//                 placeholder="Enter your full name"
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="customer-email">Email Address *</label>
//               <input
//                 type="email"
//                 id="customer-email"
//                 value={customerDetails.email}
//                 onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>
//           </div>
//           <div className="form-group">
//             <label htmlFor="customer-phone">Phone Number *</label>
//             <input
//               type="tel"
//               id="customer-phone"
//               value={customerDetails.contact}
//               onChange={(e) => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
//               placeholder="Enter your phone number"
//               required
//             />
//           </div>
//         </div>

//         <h3 className="checkout-section-title">💳 Payment Method</h3>
        
//         {process.env.NODE_ENV === 'development' && (
//           <div style={{ 
//             backgroundColor: '#f0f9ff', 
//             padding: '10px', 
//             marginBottom: '15px', 
//             borderRadius: '6px',
//             fontSize: '12px',
//             border: '1px solid #bae6fd'
//           }}>
//             <strong>Debug Info:</strong><br />
//             Razorpay Key: {process.env.REACT_APP_RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing'}<br />
//             Payment Method: {paymentMethod}<br />
//             Customer Name: {customerDetails.name || 'Not filled'}
//           </div>
//         )}
        
//         <div className="payment-method-selection">
//           <select
//             value={paymentMethod}
//             onChange={(e) => setPaymentMethod(e.target.value)}
//             className="payment-method-select"
//           >
//             <option value="razorpay">💳 Razorpay (Cards, UPI, Net Banking)</option>
//             <option value="cash_on_delivery">💵 Cash on Delivery</option>
//           </select>
          
//           {paymentMethod === 'razorpay' && (
//             <div className="razorpay-info">
//               <p>🔒 Secure payment gateway supporting:</p>
//               <ul>
//                 <li>Credit/Debit Cards</li>
//                 <li>UPI (Google Pay, PhonePe, Paytm)</li>
//                 <li>Net Banking</li>
//                 <li>Wallets</li>
//               </ul>
//             </div>
//           )}
          
//           {paymentMethod === 'cash_on_delivery' && (
//             <div className="cod-info">
//               <p>💵 Pay when you receive your order</p>
//               <p>Available for orders above ₹500</p>
//             </div>
//           )}
//         </div>

//         <div className="emi-option">
//           <button
//             onClick={handleApplyEMI}
//             className="emi-btn"
//             disabled={loading}
//             aria-label="Apply for EMI"
//           >
//             Apply for EMI
//           </button>
//         </div>

//         <div className="checkout-action">
//           <button
//             onClick={handleCheckout}
//             className="place-order-btn"
//             disabled={loading || razorpayLoading || addressError || products.length === 0 || total <= 0}
//             aria-label="Place order"
//           >
//             {loading || razorpayLoading ? '⏳ Processing...' : 
//               paymentMethod === 'razorpay' ? '🚀 Proceed to Secure Payment' : '💵 Place Order (Cash on Delivery)'}
//           </button>
//         </div>
//       </div>

//       {showEMIModal && (
//         <ApplyEMI
//           productId={products[0]?.id}
//           productName={products[0]?.title || products[0]?.name}
//           productPrice={total}
//           sellerId={products[0]?.seller_id}
//           onClose={() => setShowEMIModal(false)}
//         />
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
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

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay'); // Default Razorpay
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', contact: '' });
  
//   const { fetchCartProducts, products, loading: fetchLoading } = useFetchCartProducts(userLocation);
//   const { initiatePayment, loading: razorpayLoading } = useRazorpayPayment();
//   const navigate = useNavigate();

//   // Initialize cart and location on mount or buyerLocation change
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) return;
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then(detectedAddress => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         setManualAddress(detectedAddress || '');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation]);

//   // Reverse geocode helper
//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         { headers: { 'User-Agent': 'FreshCart/1.0' } }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (!data?.address) return null;

//       const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || 'Unknown City';
//       const postalCode = data.address.postcode || '560001';
//       return `${city}, ${data.address.state || 'Unknown State'} ${postalCode}, ${data.address.country || 'India'}`;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   };

//   // Geolocation detection with feedback
//   const handleDetectLocation = async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const position = await new Promise((resolve, reject) =>
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 300000,
//         })
//       );

//       const { latitude, longitude } = position.coords;
//       const newLocation = { lat: latitude, lon: longitude };
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);

//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         toast.success('Location detected successfully!');
//       } else {
//         toast.error('Could not detect address from coordinates.');
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) toast.error('Location access denied. Enable permissions.');
//       else if (error.code === 2) toast.error('Location unavailable. Try again.');
//       else if (error.code === 3) toast.error('Location request timed out. Try again.');
//       else toast.error('Failed to detect location. Enter manually.');
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setManualAddress(DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced manual address validation
//   const validateManualAddress = useCallback(address => {
//     if (!address || address.trim().length < 10) setAddressError('Please enter a complete address (at least 10 characters)');
//     else if (address.trim().length > 500) setAddressError('Address is too long. Keep under 500 characters.');
//     else setAddressError('');
//   }, []);
//   const debouncedValidateManualAddress = useCallback(debounce(validateManualAddress, 500), [validateManualAddress]);

//   // Validate customer details form inputs
//   const validateCustomerDetails = () => {
//     const { name, email, contact } = customerDetails;
//     if (!name || !email || !contact) {
//       toast.error('Please fill in all customer details');
//       return false;
//     }
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       toast.error('Enter a valid email');
//       return false;
//     }
//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
//       toast.error('Enter a valid phone number');
//       return false;
//     }
//     return true;
//   };

//   // Handle Razorpay payment initiation
//   const handleRazorpayPayment = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with payment');
//       navigate('/auth');
//       return;
//     }
//     if (!validateCustomerDetails()) return;
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     try {
//       const totalAmount = products.reduce((sum, product) => {
//         const price = product.selectedVariant?.price || product.price;
//         const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//         return sum + price * qty;
//       }, 0);

//       if (!totalAmount || totalAmount <= 0) {
//         toast.error('Invalid order amount. Please check your cart.');
//         return;
//       }

//       const orderData = {
//         amount: Math.round(totalAmount * 100),
//         currency: 'INR',
//         user_id: session.user.id,
//         products: products.map(product => ({
//           id: product.id,
//           name: product.title || product.name,
//           price: product.selectedVariant?.price || product.price,
//           quantity: cartItems.find(item => item.id === product.id)?.qty || 1,
//         })),
//         customer_details: customerDetails,
//         shipping_address: manualAddress,
//         metadata: { source: 'react_web_app', timestamp: new Date().toISOString() },
//       };

//       const checkoutOptions = {
//         key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: 'INR',
//         name: 'FreshCart',
//         description: `Order for ${products.length} products`,
//         prefill: customerDetails,
//         theme: { color: '#3399cc' },
//       };

//       await initiatePayment({ orderData, checkoutOptions });
//     } catch (error) {
//       console.error('Razorpay payment failed:', error);
//       toast.error(`Payment failed: ${error.message}`);
//     }
//   };

//   // Handle Cash on Delivery checkout
//   const handleTraditionalCheckout = async () => {
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }

//     setLoading(true);
//     try {
//       toast.success('Order placed successfully with Cash on Delivery!');
//       localStorage.removeItem('cart');
//       navigate('/orders');
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error('Failed to place order. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Main checkout handler — decides payment flow
//   const handleCheckout = () => {
//     return paymentMethod === 'razorpay' ? handleRazorpayPayment() : handleTraditionalCheckout();
//   };

//   const total = products.reduce((sum, product) => {
//     const price = product.selectedVariant?.price || product.price;
//     const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//     return sum + price * qty;
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>🔄 Loading your checkout...</p>
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="empty-cart-container">
//         <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
//         <h2>Your cart is empty</h2>
//         <p>Add some amazing products to your cart to proceed with checkout.</p>
//         <button onClick={() => navigate('/')} className="continue-shopping-btn">
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - FreshCart</title>
//         <meta name="description" content="Complete your purchase securely" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with confidence</p>
//       </div>

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map(p => {
//             const qty = cartItems.find(item => item.id === p.id)?.qty || 1;
//             const price = p.selectedVariant?.price || p.price;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([key, value]) => `${key}: ${value}`)
//                   .join(', ')
//               : null;

//             return (
//               <div key={p.id} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={e => { e.target.src = DEFAULT_IMAGE; }}
//                   className="checkout-item-image"
//                 />
//                 <div className="checkout-item-details">
//                   <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                   {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                   <div className="checkout-item-price-section">
//                     <div className="price-container">
//                       <span className="checkout-item-final-price">
//                         ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </span>
//                     </div>
//                   </div>
//                   <p>Quantity: {qty}</p>
//                   <p>
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <div className="checkout-details">
//         <h2 className="checkout-summary-title">Order Summary</h2>
//         <p className="checkout-total">
//           Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//         </p>

//         <h3 className="checkout-section-title">📍 Shipping Address</h3>
//         <button onClick={handleDetectLocation} className="detect-location-btn" disabled={loading} aria-label="Detect my current location">
//           Detect My Location
//         </button>
//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below.</p>
//         )}
//         <label htmlFor="shipping-address" className="address-label">Shipping Address</label>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={e => {
//             setManualAddress(e.target.value);
//             debouncedValidateManualAddress(e.target.value);
//           }}
//           placeholder="Enter your full address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//         />
//         {addressError && <p className="address-error">{addressError}</p>}

//         <h3 className="checkout-section-title">👤 Customer Details</h3>
//         <div className="customer-details-form">
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={customerDetails.name}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
//             required
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             value={customerDetails.email}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
//             required
//           />
//           <input
//             type="tel"
//             placeholder="Phone Number"
//             value={customerDetails.contact}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
//             required
//           />
//         </div>
        
//         <h3 className="checkout-section-title">💳 Payment Method</h3>
//         <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="payment-method-select" aria-label="Select payment method">
//           <option value="razorpay">Razorpay (Cards, UPI, Net Banking)</option>
//           <option value="cash_on_delivery">Cash on Delivery</option>
//         </select>

//         <div className="emi-option">
//           <button onClick={() => setShowEMIModal(true)} disabled={loading} aria-label="Apply for EMI">Apply for EMI</button>
//         </div>

//         <div className="checkout-action">
//           <button
//             onClick={handleCheckout}
//             className="place-order-btn"
//             disabled={loading || razorpayLoading || addressError || products.length === 0 || total <= 0}
//             aria-label="Place order"
//           >
//             {(loading || razorpayLoading) ? '⏳ Processing...' : (paymentMethod === 'razorpay' ? '🚀 Proceed to Secure Payment' : '💵 Place Order (Cash on Delivery)')}
//           </button>
//         </div>
//       </div>

//       {showEMIModal && <ApplyEMI productId={products[0]?.id} productName={products[0]?.title} productPrice={total} sellerId={products[0]?.seller_id} onClose={() => setShowEMIModal(false)} />}
//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
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

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('razorpay');
//   const [showEMIModal, setShowEMIModal] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', contact: '' });

//   const { fetchCartProducts, products, loading: fetchLoading } = useFetchCartProducts(userLocation);
//   const { initiatePayment, loading: razorpayLoading } = useRazorpayPayment();
//   const navigate = useNavigate();

//   // Initialize cart and location on mount or buyerLocation change
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0 || !userLocation) return;
//       fetchCartProducts(storedCart);
//     };

//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//         setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         setManualAddress(detectedAddress || '');
//       });
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Bengaluru location.');
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation]);

//   // Reverse geocode helper
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
//       return `${city}, ${data.address.state || 'Unknown State'} ${postalCode}, ${data.address.country || 'India'}`;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   };

//   // Detect user location with feedback
//   const handleDetectLocation = async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const position = await new Promise((resolve, reject) =>
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 300000,
//         })
//       );

//       const { latitude, longitude } = position.coords;
//       const newLocation = { lat: latitude, lon: longitude };
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);

//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         toast.success('Location detected successfully!');
//       } else {
//         toast.error('Could not detect address from coordinates.');
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) toast.error('Location access denied. Enable permissions.');
//       else if (error.code === 2) toast.error('Location unavailable. Try again.');
//       else if (error.code === 3) toast.error('Location request timed out. Try again.');
//       else toast.error('Failed to detect location. Enter manually.');
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setManualAddress(DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced manual address validation
//   const validateManualAddress = useCallback(
//     (address) => {
//       if (!address || address.trim().length < 10) setAddressError('Please enter a complete address (at least 10 characters)');
//       else if (address.trim().length > 500) setAddressError('Address is too long. Keep under 500 characters.');
//       else setAddressError('');
//     },
//     []
//   );
//   const debouncedValidateManualAddress = useCallback(debounce(validateManualAddress, 500), [validateManualAddress]);

//   // Validate customer details form
//   const validateCustomerDetails = () => {
//     const { name, email, contact } = customerDetails;
//     if (!name || !email || !contact) {
//       toast.error('Please fill in all customer details');
//       return false;
//     }
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       toast.error('Enter a valid email');
//       return false;
//     }
//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
//       toast.error('Enter a valid phone number');
//       return false;
//     }
//     return true;
//   };

//   // Razorpay payment initiation
//   const handleRazorpayPayment = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with payment');
//       navigate('/auth');
//       return;
//     }
//     if (!validateCustomerDetails()) return;
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }
//     try {
//       const totalAmount = products.reduce((sum, product) => {
//         const price = product.selectedVariant?.price || product.price;
//         const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//         return sum + price * qty;
//       }, 0);
//       if (!totalAmount || totalAmount <= 0) {
//         toast.error('Invalid order amount. Please check your cart.');
//         return;
//       }
//       const orderData = {
//         amount: Math.round(totalAmount * 100),
//         currency: 'INR',
//         user_id: session.user.id,
//         products: products.map(product => ({
//           id: product.id,
//           name: product.title || product.name,
//           price: product.selectedVariant?.price || product.price,
//           quantity: cartItems.find(item => item.id === product.id)?.qty || 1,
//         })),
//         customer_details: customerDetails,
//         shipping_address: manualAddress,
//         metadata: { source: 'react_web_app', timestamp: new Date().toISOString() },
//       };
//       const checkoutOptions = {
//         key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: 'INR',
//         name: 'FreshCart',
//         description: `Order for ${products.length} products`,
//         prefill: customerDetails,
//         theme: { color: '#3399cc' },
//       };
//       await initiatePayment({ orderData, checkoutOptions });
//     } catch (error) {
//       console.error('Razorpay payment failed:', error);
//       toast.error(`Payment failed: ${error.message}`);
//     }
//   };

//   // Cash on Delivery checkout
//   const handleTraditionalCheckout = async () => {
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address');
//       return;
//     }
//     setLoading(true);
//     try {
//       toast.success('Order placed successfully with Cash on Delivery!');
//       localStorage.removeItem('cart');
//       navigate('/orders');
//     } catch {
//       toast.error('Failed to place order. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Trigger checkout flow depending on method
//   const handleCheckout = () => {
//     if (paymentMethod === 'razorpay') return handleRazorpayPayment();
//     return handleTraditionalCheckout();
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const price = product.selectedVariant?.price || product.price;
//     const qty = cartItems.find(item => item.id === product.id)?.qty || 1;
//     return sum + price * qty;
//   }, 0);

//   if (fetchLoading && products.length === 0) return (
//     <div className="loading-container">
//       <div className="loading-spinner"></div>
//       <p>🔄 Loading your checkout...</p>
//     </div>
//   );

//   if (products.length === 0) return (
//     <div className="empty-cart-container">
//       <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
//       <h2>Your cart is empty</h2>
//       <p>Add some amazing products to your cart to proceed with checkout.</p>
//       <button onClick={() => navigate('/')} className="continue-shopping-btn">🛍️ Continue Shopping</button>
//     </div>
//   );

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - FreshCart</title>
//         <meta name="description" content="Complete your purchase securely" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with confidence</p>
//       </div>

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map(p => {
//             const qty = cartItems.find(item => item.id === p.id)?.qty || 1;
//             const price = p.selectedVariant?.price || p.price;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
//               : null;
//             return (
//               <div key={p.id} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={e => { e.target.src = DEFAULT_IMAGE; }}
//                   className="checkout-item-image"
//                 />
//                 <div className="checkout-item-details">
//                   <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
//                   {attrs && <p className="variant-info">Variant: {attrs}</p>}
//                   <div className="checkout-item-price-section">
//                     <div className="price-container">
//                       <span className="checkout-item-final-price">
//                         ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                       </span>
//                     </div>
//                   </div>
//                   <p>Quantity: {qty}</p>
//                   <p>Subtotal: ₹{(price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <div className="checkout-details">
//         <h2 className="checkout-summary-title">Order Summary</h2>
//         <p className="checkout-total">
//           Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//         </p>

//         <h3 className="checkout-section-title">📍 Shipping Address</h3>
//         <button onClick={handleDetectLocation} className="detect-location-btn" disabled={loading} aria-label="Detect my current location">
//           Detect My Location
//         </button>

//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below.</p>
//         )}
//         <label htmlFor="shipping-address" className="address-label">Shipping Address</label>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={e => {
//             setManualAddress(e.target.value);
//             debouncedValidateManualAddress(e.target.value);
//           }}
//           placeholder="Enter your full address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//         />
//         {addressError && <p className="address-error">{addressError}</p>}

//         <h3 className="checkout-section-title">👤 Customer Details</h3>
//         <div className="customer-details-form">
//           <input
//             type="text"
//             placeholder="Full Name"
//             value={customerDetails.name}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
//             required
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             value={customerDetails.email}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
//             required
//           />
//           <input
//             type="tel"
//             placeholder="Phone Number"
//             value={customerDetails.contact}
//             onChange={e => setCustomerDetails(prev => ({ ...prev, contact: e.target.value }))}
//             required
//           />
//         </div>

//         <h3 className="checkout-section-title">💳 Payment Method</h3>
//         <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="payment-method-select" aria-label="Select payment method">
//           <option value="razorpay">Razorpay (Cards, UPI, Net Banking)</option>
//           <option value="cash_on_delivery">Cash on Delivery</option>
//         </select>

//         <div className="emi-option">
//           <button onClick={() => setShowEMIModal(true)} disabled={loading} aria-label="Apply for EMI">Apply for EMI</button>
//         </div>

//         <div className="checkout-action">
//           <button
//             onClick={handleCheckout}
//             className="place-order-btn"
//             disabled={loading || razorpayLoading || addressError || products.length === 0 || total <= 0}
//             aria-label="Place order"
//           >
//             {(loading || razorpayLoading) ? '⏳ Processing...' : (paymentMethod === 'razorpay' ? '🚀 Proceed to Secure Payment' : '💵 Place Order (Cash on Delivery)')}
//           </button>
//         </div>
//       </div>

//       {showEMIModal && (
//         <ApplyEMI
//           productId={products[0]?.id}
//           productName={products[0]?.title}
//           productPrice={total}
//           sellerId={products[0]?.seller_id}
//           onClose={() => setShowEMIModal(false)}
//         />
//       )}

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
import '../style/Checkout.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
const DEFAULT_LOCATION = { lat: 12.9753, lon: 77.591 };
const DEFAULT_ADDRESS = 'Bangalore, Karnataka 560001, India';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Retry helper for API calls
const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * 2 ** (attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

function Checkout() {
  const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchCartProducts, products, loading: fetchLoading, error: fetchError } = useFetchCartProducts(userLocation);
  const navigate = useNavigate();

  // Initialize cart and location on mount or buyerLocation change
  useEffect(() => {
    const initializeCart = async () => {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);

      if (storedCart.length === 0) return;
      if (!userLocation) return;
      await fetchCartProducts(storedCart);
      if (fetchError) {
        toast.error(`Failed to load cart: ${fetchError}`, { duration: 3000 });
      }
    };

    const cachedAddress = localStorage.getItem('cachedAddress');
    if (buyerLocation) {
      setUserLocation(buyerLocation);
      if (cachedAddress) {
        setAddress(cachedAddress);
        setManualAddress(cachedAddress);
      } else {
        reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
          const addr = detectedAddress || DEFAULT_ADDRESS;
          setAddress(addr);
          setManualAddress(addr);
          localStorage.setItem('cachedAddress', addr);
        });
      }
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setAddress(DEFAULT_ADDRESS);
      setManualAddress(DEFAULT_ADDRESS);
      localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
      toast.error('Unable to detect location; using default Bengaluru location.', { duration: 3000 });
    }

    initializeCart();
  }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

  // Reverse geocode helper using Mapbox
  const reverseGeocode = async (lat, lon) => {
    try {
      const fn = () =>
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
          { headers: { 'Accept': 'application/json' } }
        ).then(resp => {
          if (!resp.ok) throw new Error('Reverse geocoding failed');
          return resp.json();
        });
      const data = await retryRequest(fn);
      return data.features?.[0]?.place_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('Failed to fetch address from coordinates.', { duration: 3000 });
      return null;
    }
  };

  // Detect user location with feedback
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.', { duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      );

      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lon: longitude };
      setBuyerLocation(newLocation);
      setUserLocation(newLocation);

      const detectedAddress = await reverseGeocode(latitude, longitude);
      if (detectedAddress) {
        setAddress(detectedAddress);
        setManualAddress(detectedAddress);
        localStorage.setItem('cachedAddress', detectedAddress);
        toast.success('📍 Location and address detected successfully!', { duration: 3000 });
      } else {
        toast.error('Could not detect address from coordinates. Please enter manually.', { duration: 3000 });
        setAddress(DEFAULT_ADDRESS);
        setManualAddress(DEFAULT_ADDRESS);
        localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      if (error.code === 1) toast.error('Location access denied. Please enable permissions.', { duration: 3000 });
      else if (error.code === 2) toast.error('Location unavailable. Please try again.', { duration: 3000 });
      else if (error.code === 3) toast.error('Location request timed out. Please try again.', { duration: 3000 });
      else toast.error('Failed to detect location. Please enter manually.', { duration: 3000 });
      setUserLocation(DEFAULT_LOCATION);
      setBuyerLocation(DEFAULT_LOCATION);
      setAddress(DEFAULT_ADDRESS);
      setManualAddress(DEFAULT_ADDRESS);
      localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
    } finally {
      setLoading(false);
    }
  };

  // Manual address validation
  const validateManualAddress = (address) => {
    if (!address || address.trim().length < 10) {
      setAddressError('Please enter a complete address (at least 10 characters)');
    } else if (address.trim().length > 500) {
      setAddressError('Address is too long. Keep under 500 characters.');
    } else {
      setAddressError('');
    }
  };

  // Debounced address validation
  const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

  // Cash on Delivery checkout with order insertion
  const handleCheckout = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to proceed with checkout', { duration: 3000 });
      navigate('/auth');
      return;
    }
    if (!manualAddress || manualAddress.trim().length < 10) {
      toast.error('Please enter a valid shipping address', { duration: 3000 });
      return;
    }
    if (products.length === 0 || cartItems.length === 0) {
      toast.error('Your cart is empty. Please add items to proceed.', { duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      // Group products by seller_id for multiple sellers
      const ordersBySeller = products.reduce((acc, product) => {
        const sellerId = product.seller_id;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(product);
        return acc;
      }, {});

      for (const sellerId of Object.keys(ordersBySeller)) {
        const sellerProducts = ordersBySeller[sellerId];
        const sellerTotal = sellerProducts.reduce((sum, product) => {
          const cartItem = cartItems.find(item => item.id === product.cartId);
          const price = product.selectedVariant?.price || product.price || 0;
          const qty = cartItem?.quantity || 1;
          return sum + (Number.isFinite(price) ? price * qty : 0);
        }, 0);

        // Insert order into orders table
        const orderData = {
          user_id: session.user.id,
          total: sellerTotal,
          total_amount: sellerTotal,
          order_status: 'Order Placed',
          payment_method: 'cash_on_delivery',
          shipping_address: manualAddress,
          created_at: new Date().toISOString(),
          seller_id: sellerId,
        };
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        if (orderError) throw new Error(`Order insertion error: ${orderError.message}`);

        // Insert order items
        const orderItems = sellerProducts.map(product => {
          const cartItem = cartItems.find(item => item.id === product.cartId);
          return {
            order_id: order.id,
            product_id: product.id,
            quantity: cartItem?.quantity || 1,
            price: product.selectedVariant?.price || product.price || 0,
            variant_id: product.selectedVariant?.id || null,
          };
        });
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw new Error(`Order items insertion error: ${itemsError.message}`);
      }

      // Clear cart after successful order
      const { error: clearCartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', session.user.id);
      if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);

      toast.success('🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.', { duration: 5000 });
      localStorage.setItem('cart', JSON.stringify([]));
      setCartItems([]);
      navigate('/account');
    } catch (error) {
      console.error('COD checkout error:', error);
      toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Calculate order total
  const total = products.reduce((sum, product) => {
    const cartItem = cartItems.find(item => item.id === product.cartId);
    const price = product.selectedVariant?.price || product.price || 0;
    const qty = cartItem?.quantity || 1;
    return sum + (Number.isFinite(price) ? price * qty : 0);
  }, 0);

  if (fetchLoading && products.length === 0) return (
    <div className="loading-container" aria-live="polite">
      <div className="loading-spinner"></div>
      <p>🔄 Loading your checkout...</p>
    </div>
  );

  if (products.length === 0) return (
    <div className="empty-cart-container">
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
      <h2>Your cart is empty</h2>
      <p>Add some amazing products to your cart to proceed with checkout.</p>
      <button onClick={() => navigate('/')} className="continue-shopping-btn">🛍️ Continue Shopping</button>
    </div>
  );

  return (
    <div className="checkout-container fade-in">
      <Helmet>
        <title>Checkout - Markeet</title>
        <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
        <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.markeet.com/checkout" />
      </Helmet>

      <div className="checkout-header slide-up">
        <h1>🛒 Secure Checkout</h1>
        <p>Complete your purchase with Cash on Delivery</p>
      </div>

      <div className="cart-items-section">
        <h2 className="cart-items-title">Items in Cart</h2>
        <div className="cart-items-list">
          {products.map(p => {
            const cartItem = cartItems.find(item => item.id === p.cartId);
            const qty = cartItem?.quantity || 1;
            const price = p.selectedVariant?.price || p.price || 0;
            const attrs = p.selectedVariant?.attributes
              ? Object.entries(p.selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
              : null;
            return (
              <div key={p.uniqueKey} className="checkout-item">
                <img
                  src={p.images?.[0] || DEFAULT_IMAGE}
                  alt={p.title || 'Unnamed Product'}
                  onError={e => { e.target.src = DEFAULT_IMAGE; }}
                  className="checkout-item-image"
                />
                <div className="checkout-item-details">
                  <h3 className="checkout-item-title">{p.title || 'Unnamed Product'}</h3>
                  {attrs && <p className="variant-info">Variant: {attrs}</p>}
                  <div className="checkout-item-price-section">
                    <div className="price-container">
                      <span className="checkout-item-final-price">
                        ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <p>Quantity: {qty}</p>
                  <p>Subtotal: ₹{(price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="checkout-details">
        <h2 className="checkout-summary-title">Order Summary</h2>
        <p className="checkout-total">
          Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        <h3 className="checkout-section-title">📍 Shipping Address</h3>
        <button
          onClick={handleDetectLocation}
          className="detect-location-btn"
          disabled={loading}
          aria-label="Detect my current location"
        >
          Detect My Location
        </button>

        {userLocation && address ? (
          <p className="detected-address">
            Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
          </p>
        ) : (
          <p className="no-address">Please enter your address below.</p>
        )}
        <label htmlFor="shipping-address" className="address-label">Shipping Address</label>
        <textarea
          id="shipping-address"
          value={manualAddress}
          onChange={e => {
            setManualAddress(e.target.value);
            debouncedValidateManualAddress(e.target.value);
          }}
          placeholder="Enter your full address (e.g., 123 Main St, Bangalore, Karnataka, India)"
          rows="4"
          className="address-textarea"
          aria-label="Enter shipping address"
          aria-describedby="address-error"
          aria-invalid={!!addressError}
        />
        {addressError && <p id="address-error" className="address-error">{addressError}</p>}

        <h3 className="checkout-section-title">💵 Payment Method</h3>
        <p className="payment-method">Cash on Delivery</p>

        <div className="checkout-action">
          <button
            onClick={handleCheckout}
            className="place-order-btn"
            disabled={loading || addressError || products.length === 0}
            aria-label="Place order with Cash on Delivery"
            aria-busy={loading}
          >
            {loading ? '⏳ Processing...' : '💵 Place Order (Cash on Delivery)'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Checkout;