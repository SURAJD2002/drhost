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

// import React, { useState, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

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

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   // Initialize cart and location on mount or buyerLocation change
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart);
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, { duration: 3000 });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Bengaluru location.', { duration: 3000 });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

//   // Reverse geocode helper using Mapbox
//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then(resp => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', { duration: 3000 });
//       return null;
//     }
//   };

//   // Detect user location with feedback
//   const handleDetectLocation = async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', { duration: 3000 });
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
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', { duration: 3000 });
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', { duration: 3000 });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) toast.error('Location access denied. Please enable permissions.', { duration: 3000 });
//       else if (error.code === 2) toast.error('Location unavailable. Please try again.', { duration: 3000 });
//       else if (error.code === 3) toast.error('Location request timed out. Please try again.', { duration: 3000 });
//       else toast.error('Failed to detect location. Please enter manually.', { duration: 3000 });
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Manual address validation
//   const validateManualAddress = (address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   };

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Cash on Delivery checkout with order insertion
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', { duration: 3000 });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', { duration: 3000 });
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id for multiple sellers
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find(item => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Insert order into orders table
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//         };
//         const { data: order, error: orderError } = await supabase
//           .from('orders')
//           .insert(orderData)
//           .select()
//           .single();
//         if (orderError) throw new Error(`Order insertion error: ${orderError.message}`);

//         // Insert order items
//         const orderItems = sellerProducts.map(product => {
//           const cartItem = cartItems.find(item => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
//         if (itemsError) throw new Error(`Order items insertion error: ${itemsError.message}`);
//       }

//       // Clear cart after successful order
//       const { error: clearCartError } = await supabase
//         .from('cart')
//         .delete()
//         .eq('user_id', session.user.id);
//       if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);

//       toast.success('🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.', { duration: 5000 });
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) return (
//     <div className="loading-container" aria-live="polite">
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
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map(p => {
//             const cartItem = cartItems.find(item => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
//               : null;
//             return (
//               <div key={p.uniqueKey} className="checkout-item">
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
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && <p id="address-error" className="address-error">{addressError}</p>}

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <button
//             onClick={handleCheckout}
//             className="place-order-btn"
//             disabled={loading || addressError || products.length === 0}
//             aria-label="Place order with Cash on Delivery"
//             aria-busy={loading}
//           >
//             {loading ? '⏳ Processing...' : '💵 Place Order (Cash on Delivery)'}
//           </button>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/150'; // Consistent with Products.js
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   const toRad = (deg) => (deg * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.asin(Math.sqrt(a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', { duration: 3000 });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart);
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, { duration: 3000 });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', { duration: 3000 });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', { duration: 3000 });
//       return null;
//     }
//   }, []);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', { duration: 3000 });
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
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', { duration: 3000 });
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', { duration: 3000 });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions in your browser settings to proceed.',
//           { duration: 4000 }
//         );
//         setLocationPermission('denied');
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again.', { duration: 3000 });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.', { duration: 3000 });
//       } else {
//         toast.error('Failed to detect location. Please enter manually.', { duration: 3000 });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation]);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       if (!product.latitude || !product.longitude || !product.delivery_radius_km) {
//         return false; // Missing location or radius data
//       }
//       const distance = calculateDistance(
//         userLocation.lat,
//         userLocation.lon,
//         product.latitude,
//         product.longitude
//       );
//       return distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', { duration: 3000 });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', { duration: 3000 });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', { duration: 3000 });
//       return;
//     }
//     if (locationPermission !== 'granted') {
//       toast.error(
//         'Location access is required to confirm your order. Please enable location permissions and try again.',
//         { duration: 4000 }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius.',
//         { duration: 4000 }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Insert order
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//         };
//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase.from('orders').insert(orderData).select().single()
//         );
//         if (orderError) throw new Error(`Order insertion error: ${orderError.message}`);

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) throw new Error(`Order items insertion error: ${itemsError.message}`);
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000 }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, { duration: 4000 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(
//                   userLocation.lat,
//                   userLocation.lon,
//                   p.latitude,
//                   p.longitude
//                 ).toFixed(2)
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation.lat, userLocation.lon, p.latitude, p.longitude) <=
//                   p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
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
//         {locationPermission === 'denied' && (
//           <p className="location-error">
//             Location access is required to confirm your order. Please enable location permissions in your browser
//             settings:
//             <ul>
//               <li>
//                 <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                 "Location" to "Allow".
//               </li>
//               <li>
//                 <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//               </li>
//               <li>
//                 <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//               </li>
//               <li>
//                 <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                 "Allow".
//               </li>
//             </ul>
//           </p>
//         )}
//         <button
//           onClick={handleDetectLocation}
//           className="detect-location-btn"
//           disabled={loading || locationPermission === 'granted'}
//           aria-label="Detect my current location"
//         >
//           {locationPermission === 'granted' ? '📍 Location Detected' : 'Detect My Location'}
//         </button>

//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
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
//           placeholder="Enter your full address (e.g., Jharia, Dhanbad, Jharkhand 828111, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <button
//             onClick={handleCheckout}
//             className="place-order-btn"
//             disabled={loading || addressError || products.length === 0 || locationPermission !== 'granted' || !areProductsInRange()}
//             aria-label="Place order with Cash on Delivery"
//             aria-busy={loading}
//           >
//             {loading ? '⏳ Processing...' : '💵 Place Order (Cash on Delivery)'}
//           </button>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;





// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/150'; // Consistent with Products.js
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   const toRad = (deg) => (deg * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.asin(Math.sqrt(a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     const invalidProducts = [];
//     const allInRange = products.every((product) => {
//       if (!product.latitude || !product.longitude || !product.delivery_radius_km) {
//         console.warn('Missing location data for product:', product);
//         invalidProducts.push(product.title || 'Unnamed Product');
//         return false; // Missing location or radius data
//       }
//       const distance = calculateDistance(
//         userLocation.lat,
//         userLocation.lon,
//         product.latitude,
//         product.longitude
//       );
//       return distance <= product.delivery_radius_km;
//     });
//     if (invalidProducts.length > 0) {
//       toast.error(
//         `Some products (${invalidProducts.join(', ')}) lack location data. Please remove them or contact support.`,
//         {
//           duration: 6000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         }
//       );
//     }
//     return allInRange;
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button when prompt is shown
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart);
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
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
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions in your browser settings to proceed.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed with checkout';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError || !manualAddress || manualAddress.trim().length < 10)
//       return 'Please enter a valid shipping address';
//     if (locationPermission !== 'granted')
//       return 'Location access is required to confirm your order';
//     if (!areProductsInRange()) return 'Some products are not available at your location';
//     return null;
//   }, [loading, session, products, cartItems, addressError, manualAddress, locationPermission, areProductsInRange]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (locationPermission !== 'granted') {
//       toast.error(
//         'Location access is required to confirm your order. Please enable location permissions and try again.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Insert order
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//         };
//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase.from('orders').insert(orderData).select().single()
//         );
//         if (orderError) throw new Error(`Order insertion error: ${orderError.message}`);

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) throw new Error(`Order items insertion error: ${itemsError.message}`);
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000, style: { background: '#10b981', color: '#fff' } }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify that all items can be delivered to you.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is currently denied. Please enable it in your browser settings.'
//               : 'Please allow location access when prompted or click "Detect My Location" below.'}
//           </p>
//           {locationPermission === 'denied' && (
//             <div className="browser-instructions">
//               <p>Enable location permissions in your browser:</p>
//               <ul>
//                 <li>
//                   <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                   "Location" to "Allow".
//                 </li>
//                 <li>
//                   <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//                 </li>
//                 <li>
//                   <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//                 </li>
//                 <li>
//                   <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                   "Allow".
//                 </li>
//               </ul>
//             </div>
//           )}
//           <button
//             ref={detectLocationButtonRef}
//             onClick={handleDetectLocation}
//             className="detect-location-btn prompt-btn"
//             disabled={loading}
//             aria-label="Detect my current location"
//           >
//             {loading ? (
//               <>
//                 <span className="spinner small"></span> Detecting...
//               </>
//             ) : (
//               '📍 Detect My Location'
//             )}
//           </button>
//           {locationPermission === 'denied' && (
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss location prompt"
//             >
//               Dismiss
//             </button>
//           )}
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(
//                   userLocation.lat,
//                   userLocation.lon,
//                   p.latitude,
//                   p.longitude
//                 ).toFixed(2)
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation.lat, userLocation.lon, p.latitude, p.longitude) <=
//                   p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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
//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below or detect your location.</p>
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
//           placeholder="Enter your full address (e.g., Jharia, Dhanbad, Jharkhand 828111, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (userLoc, productLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     !productLoc?.delivery_radius_km ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return null; // Indicate invalid data
//   }
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((productLoc.latitude * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       const distance = calculateDistance(userLocation, {
//         latitude: product.latitude,
//         longitude: product.longitude,
//         delivery_radius_km: product.delivery_radius_km,
//       });
//       return distance !== null && distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button when prompt is shown
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart, (invalid) => {
//         if (invalid.length > 0) {
//           toast.error(
//             `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//             { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//           );
//         }
//       });
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
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
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions in your browser settings to proceed.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed with checkout';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError || !manualAddress || manualAddress.trim().length < 10)
//       return 'Please enter a valid shipping address';
//     if (locationPermission !== 'granted')
//       return 'Location access is required to confirm your order';
//     if (!areProductsInRange()) return 'Some products are not available at your location';
//     return null;
//   }, [loading, session, products, cartItems, addressError, manualAddress, locationPermission, areProductsInRange]);

//   // Remove invalid products from cart
//   const handleRemoveInvalidProducts = useCallback(() => {
//     const validCartItems = cartItems.filter(item => {
//       const product = products.find(p => p.cartId === item.id);
//       return product && product.latitude && product.longitude && product.delivery_radius_km;
//     });
//     setCartItems(validCartItems);
//     localStorage.setItem('cart', JSON.stringify(validCartItems));
//     toast.success('Removed unavailable products from cart.', {
//       duration: 4000,
//       style: { background: '#10b981', color: '#fff' },
//     });
//     fetchCartProducts(validCartItems, (invalid) => {
//       if (invalid.length > 0) {
//         toast.error(
//           `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//       }
//     });
//   }, [cartItems, products, fetchCartProducts]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (locationPermission !== 'granted') {
//       toast.error(
//         'Location access is required to confirm your order. Please enable location permissions and try again.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius or remove unavailable items.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Insert order
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//         };
//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase.from('orders').insert(orderData).select().single()
//         );
//         if (orderError) throw new Error(`Order insertion error: ${orderError.message}`);

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) throw new Error(`Order items insertion error: ${itemsError.message}`);
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000, style: { background: '#10b981', color: '#fff' } }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify that all items can be delivered to you.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is currently denied. Please enable it in your browser settings.'
//               : 'Please allow location access when prompted or click "Detect My Location" below.'}
//           </p>
//           {locationPermission === 'denied' && (
//             <div className="browser-instructions">
//               <p>Enable location permissions in your browser:</p>
//               <ul>
//                 <li>
//                   <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                   "Location" to "Allow".
//                 </li>
//                 <li>
//                   <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//                 </li>
//                 <li>
//                   <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//                 </li>
//                 <li>
//                   <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                   "Allow".
//                 </li>
//               </ul>
//             </div>
//           )}
//           <button
//             ref={detectLocationButtonRef}
//             onClick={handleDetectLocation}
//             className="detect-location-btn prompt-btn"
//             disabled={loading}
//             aria-label="Detect my current location"
//           >
//             {loading ? (
//               <>
//                 <span className="spinner small"></span> Detecting...
//               </>
//             ) : (
//               '📍 Detect My Location'
//             )}
//           </button>
//           {locationPermission === 'denied' && (
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss location prompt"
//             >
//               Dismiss
//             </button>
//           )}
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         {invalidProducts.length > 0 && (
//           <div className="invalid-products-warning" role="alert">
//             <p>
//               The following products are unavailable due to missing location data or being out of delivery range:{' '}
//               {invalidProducts.join(', ')}.{' '}
//               <button
//                 onClick={handleRemoveInvalidProducts}
//                 className="remove-invalid-btn"
//                 aria-label="Remove unavailable products from cart"
//               >
//                 Remove Unavailable Items
//               </button>
//             </p>
//           </div>
//         )}
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(userLocation, {
//                   latitude: p.latitude,
//                   longitude: p.longitude,
//                   delivery_radius_km: p.delivery_radius_km,
//                 })?.toFixed(2) || 'N/A'
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation, {
//                     latitude: p.latitude,
//                     longitude: p.longitude,
//                     delivery_radius_km: p.delivery_radius_km,
//                   }) <= p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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
//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below or detect your location.</p>
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
//           placeholder="Enter your full address (e.g., Jharia, Dhanbad, Jharkhand 828111, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (userLoc, productLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     !productLoc?.delivery_radius_km ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return null; // Indicate invalid data
//   }
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((productLoc.latitude * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const [manualLat, setManualLat] = useState('');
//   const [manualLon, setManualLon] = useState('');
//   const [locationError, setLocationError] = useState('');
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       const distance = calculateDistance(userLocation, {
//         latitude: product.latitude,
//         longitude: product.longitude,
//         delivery_radius_km: product.delivery_radius_km,
//       });
//       return distance !== null && distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button when prompt is shown
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart, (invalid) => {
//         if (invalid.length > 0) {
//           toast.error(
//             `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//             { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//           );
//         }
//       });
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     const cachedLocation = JSON.parse(localStorage.getItem('cachedLocation'));
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//       if (cachedLocation) {
//         setManualLat(cachedLocation.lat.toString());
//         setManualLon(cachedLocation.lon.toString());
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError]);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=address,place,locality,neighborhood`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
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
//       localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions or set location manually.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again or set location manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again or set location manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter manually or set coordinates.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Validate manual latitude and longitude
//   const validateCoordinates = useCallback((lat, lon) => {
//     const latNum = parseFloat(lat);
//     const lonNum = parseFloat(lon);
//     if (isNaN(latNum) || latNum < -90 || latNum > 90) {
//       return 'Latitude must be a number between -90 and 90.';
//     }
//     if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
//       return 'Longitude must be a number between -180 and 180.';
//     }
//     return '';
//   }, []);

//   // Handle manual location setting
//   const handleSetLocation = useCallback(async () => {
//     const error = validateCoordinates(manualLat, manualLon);
//     if (error) {
//       setLocationError(error);
//       return;
//     }
//     setLocationError('');
//     setLoading(true);
//     try {
//       const newLocation = { lat: parseFloat(manualLat), lon: parseFloat(manualLon) };
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);
//       localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

//       const detectedAddress = await reverseGeocode(newLocation.lon, newLocation.lat);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location set successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not fetch address for the provided coordinates. Please enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Manual location setting error:', error);
//       toast.error('Failed to set location. Please try again.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     } finally {
//       setLoading(false);
//       setManualLat('');
//       setManualLon('');
//     }
//   }, [manualLat, manualLon, reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed with checkout';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError || !manualAddress || manualAddress.trim().length < 10)
//       return 'Please enter a valid shipping address';
//     if (!userLocation?.lat || !userLocation?.lon)
//       return 'Location coordinates are required to confirm your order';
//     if (!areProductsInRange()) return 'Some products are not available at your location';
//     return null;
//   }, [loading, session, products, cartItems, addressError, manualAddress, userLocation, areProductsInRange]);

//   // Remove invalid products from cart
//   const handleRemoveInvalidProducts = useCallback(() => {
//     const validCartItems = cartItems.filter(item => {
//       const product = products.find(p => p.cartId === item.id);
//       return product && product.latitude && product.longitude && product.delivery_radius_km;
//     });
//     setCartItems(validCartItems);
//     localStorage.setItem('cart', JSON.stringify(validCartItems));
//     toast.success('Removed unavailable products from cart.', {
//       duration: 4000,
//       style: { background: '#10b981', color: '#fff' },
//     });
//     fetchCartProducts(validCartItems, (invalid) => {
//       if (invalid.length > 0) {
//         toast.error(
//           `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//       }
//     });
//   }, [cartItems, products, fetchCartProducts]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (!userLocation?.lat || !userLocation?.lon) {
//       toast.error(
//         'Location coordinates are required to confirm your order. Please detect or set your location.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius or remove unavailable items.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Insert order with shipping_location as PostGIS point using raw SQL
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//         };

//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert({
//               ...orderData,
//               shipping_location: userLocation
//                 ? supabase.sql`ST_SetSRID(ST_MakePoint(${userLocation.lon}, ${userLocation.lat}), 4326)`
//                 : null,
//             })
//             .select()
//             .single()
//         );
//         if (orderError) {
//           console.error('Order insertion error:', orderError);
//           throw new Error(`Order insertion error: ${orderError.message}`);
//         }

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) {
//           console.error('Order items insertion error:', itemsError);
//           throw new Error(`Order items insertion error: ${itemsError.message}`);
//         }
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) {
//         console.error('Cart clearing error:', clearCartError);
//         throw new Error(`Failed to clear cart: ${clearCartError.message}`);
//       }

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000, style: { background: '#10b981', color: '#fff' } }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify that all items can be delivered to you.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is currently denied. Please enable it in your browser settings or set coordinates manually.'
//               : 'Please allow location access, click "Detect My Location", or set coordinates manually below.'}
//           </p>
//           {locationPermission === 'denied' && (
//             <div className="browser-instructions">
//               <p>Enable location permissions in your browser:</p>
//               <ul>
//                 <li>
//                   <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                   "Location" to "Allow".
//                 </li>
//                 <li>
//                   <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//                 </li>
//                 <li>
//                   <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//                 </li>
//                 <li>
//                   <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                   "Allow".
//                 </li>
//               </ul>
//             </div>
//           )}
//           <div className="location-buttons">
//             <button
//               ref={detectLocationButtonRef}
//               onClick={handleDetectLocation}
//               className="detect-location-btn prompt-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect My Location'
//               )}
//             </button>
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss location prompt"
//             >
//               Dismiss
//             </button>
//           </div>
//           <div className="manual-location-input">
//             <h4>Or Set Location Manually</h4>
//             <div className="coordinate-inputs">
//               <label htmlFor="manual-lat">Latitude</label>
//               <input
//                 id="manual-lat"
//                 type="number"
//                 step="any"
//                 value={manualLat}
//                 onChange={(e) => setManualLat(e.target.value)}
//                 placeholder="e.g., 23.7407"
//                 aria-describedby="location-error"
//                 className="coordinate-input"
//               />
//               <label htmlFor="manual-lon">Longitude</label>
//               <input
//                 id="manual-lon"
//                 type="number"
//                 step="any"
//                 value={manualLon}
//                 onChange={(e) => setManualLon(e.target.value)}
//                 placeholder="e.g., 86.4146"
//                 aria-describedby="location-error"
//                 className="coordinate-input"
//               />
//             </div>
//             {locationError && (
//               <p id="location-error" className="location-error">
//                 {locationError}
//               </p>
//             )}
//             <button
//               onClick={handleSetLocation}
//               className="set-location-btn"
//               disabled={loading || !manualLat || !manualLon}
//               aria-label="Set manual location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Setting...
//                 </>
//               ) : (
//                 '📍 Set Location'
//               )}
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         {invalidProducts.length > 0 && (
//           <div className="invalid-products-warning" role="alert">
//             <p>
//               The following products are unavailable due to missing location data or being out of delivery range:{' '}
//               {invalidProducts.join(', ')}.{' '}
//               <button
//                 onClick={handleRemoveInvalidProducts}
//                 className="remove-invalid-btn"
//                 aria-label="Remove unavailable products from cart"
//               >
//                 Remove Unavailable Items
//               </button>
//             </p>
//           </div>
//         )}
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(userLocation, {
//                   latitude: p.latitude,
//                   longitude: p.longitude,
//                   delivery_radius_km: p.delivery_radius_km,
//                 })?.toFixed(2) || 'N/A'
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation, {
//                     latitude: p.latitude,
//                     longitude: p.longitude,
//                     delivery_radius_km: p.delivery_radius_km,
//                   }) <= p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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
//         {userLocation && address ? (
//           <p className="detected-address">
//             Detected: {address} (Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)})
//           </p>
//         ) : (
//           <p className="no-address">Please enter your address below or set your location.</p>
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
//           placeholder="Enter your full address (e.g., Mdr055, 828126, Sudamdih, Jharia, Dhanbad, Jharkhand, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}
//         <div className="location-input-section">
//           <div className="coordinate-inputs">
//             <label htmlFor="manual-lat">Latitude</label>
//             <input
//               id="manual-lat"
//               type="number"
//               step="any"
//               value={manualLat}
//               onChange={(e) => setManualLat(e.target.value)}
//               placeholder="e.g., 23.7407"
//               aria-describedby="location-error"
//               className="coordinate-input"
//             />
//             <label htmlFor="manual-lon">Longitude</label>
//             <input
//               id="manual-lon"
//               type="number"
//               step="any"
//               value={manualLon}
//               onChange={(e) => setManualLon(e.target.value)}
//               placeholder="e.g., 86.4146"
//               aria-describedby="location-error"
//               className="coordinate-input"
//             />
//           </div>
//           {locationError && (
//             <p id="location-error" className="location-error">
//               {locationError}
//             </p>
//           )}
//           <div className="location-buttons">
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect Location'
//               )}
//             </button>
//             <button
//               onClick={handleSetLocation}
//               className="set-location-btn"
//               disabled={loading || !manualLat || !manualLon}
//               aria-label="Set manual location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Setting...
//                 </>
//               ) : (
//                 '📍 Set Location'
//               )}
//             </button>
//           </div>
//         </div>

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (userLoc, productLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     !productLoc?.delivery_radius_km ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return null; // Indicate invalid data
//   }
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((productLoc.latitude * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       const distance = calculateDistance(userLocation, {
//         latitude: product.latitude,
//         longitude: product.longitude,
//         delivery_radius_km: product.delivery_radius_km,
//       });
//       return distance !== null && distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Forward geocode using Mapbox to get coordinates from address
//   const forwardGeocode = useCallback(async (address) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,neighborhood&country=IN`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Forward geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       const feature = data.features?.[0];
//       if (feature?.geometry?.coordinates) {
//         const [lon, lat] = feature.geometry.coordinates;
//         return { lat, lon };
//       }
//       return null;
//     } catch (error) {
//       console.error('Forward geocoding error:', error);
//       toast.error('Failed to fetch coordinates from address.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,neighborhood&country=IN`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error('Reverse geocoding failed');
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Handle manual address change and geocode to coordinates
//   const handleManualAddressChange = useCallback(
//     async (newAddress) => {
//       setManualAddress(newAddress);
//       debouncedValidateManualAddress(newAddress);
//       if (newAddress && newAddress.trim().length >= 10) {
//         setLoading(true);
//         try {
//           const coords = await forwardGeocode(newAddress);
//           if (coords) {
//             setUserLocation(coords);
//             setBuyerLocation(coords);
//             localStorage.setItem('cachedLocation', JSON.stringify(coords));
//             toast.success('📍 Coordinates updated from address!', {
//               duration: 4000,
//               style: { background: '#10b981', color: '#fff' },
//             });
//           } else {
//             setUserLocation(DEFAULT_LOCATION);
//             setBuyerLocation(DEFAULT_LOCATION);
//             localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//             toast.error('Could not fetch coordinates for this address. Using default location.', {
//               duration: 4000,
//               style: { background: '#ff4d4f', color: '#fff' },
//             });
//           }
//         } catch (error) {
//           console.error('Address geocoding error:', error);
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Failed to fetch coordinates for this address. Using default location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         } finally {
//           setLoading(false);
//         }
//       }
//     },
//     [debouncedValidateManualAddress, forwardGeocode, setBuyerLocation]
//   );

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button when prompt is shown
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart, (invalid) => {
//         if (invalid.length > 0) {
//           toast.error(
//             `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//             { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//           );
//         }
//       });
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     const cachedLocation = JSON.parse(localStorage.getItem('cachedLocation'));
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError, reverseGeocode]);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
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
//       localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions or enter address manually.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again or enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again or enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed with checkout';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError || !manualAddress || manualAddress.trim().length < 10)
//       return 'Please enter a valid shipping address';
//     if (!userLocation?.lat || !userLocation?.lon)
//       return 'Location coordinates are required to confirm your order';
//     if (!areProductsInRange()) return 'Some products are not available at your location';
//     return null;
//   }, [loading, session, products, cartItems, addressError, manualAddress, userLocation, areProductsInRange]);

//   // Remove invalid products from cart
//   const handleRemoveInvalidProducts = useCallback(() => {
//     const validCartItems = cartItems.filter((item) => {
//       const product = products.find((p) => p.cartId === item.id);
//       return product && product.latitude && product.longitude && product.delivery_radius_km;
//     });
//     setCartItems(validCartItems);
//     localStorage.setItem('cart', JSON.stringify(validCartItems));
//     toast.success('Removed unavailable products from cart.', {
//       duration: 4000,
//       style: { background: '#10b981', color: '#fff' },
//     });
//     fetchCartProducts(validCartItems, (invalid) => {
//       if (invalid.length > 0) {
//         toast.error(
//           `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//       }
//     });
//   }, [cartItems, products, fetchCartProducts]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10) {
//       toast.error('Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (!userLocation?.lat || !userLocation?.lon) {
//       console.error('Checkout attempted without userLocation:', userLocation);
//       toast.error(
//         'Location coordinates are required to confirm your order. Please detect your location or ensure your address is valid.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius or remove unavailable items.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Format shipping_location as WKT POINT
//         const shippingLocationWKT = userLocation
//           ? `POINT(${userLocation.lon} ${userLocation.lat})`
//           : null;

//         // Log order data for debugging
//         console.log('Inserting order with data:', {
//           user_id: session.user.id,
//           seller_id: sellerId,
//           total: sellerTotal,
//           shipping_address: manualAddress,
//           shipping_location: shippingLocationWKT,
//         });

//         // Insert order with shipping_location as WKT string
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//           shipping_location: shippingLocationWKT,
//         };

//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert(orderData)
//             .select()
//             .single()
//         );
//         if (orderError) {
//           console.error('Order insertion error:', orderError);
//           throw new Error(`Order insertion error: ${orderError.message}`);
//         }

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) {
//           console.error('Order items insertion error:', itemsError);
//           throw new Error(`Order items insertion error: ${itemsError.message}`);
//         }
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) {
//         console.error('Cart clearing error:', clearCartError);
//         throw new Error(`Failed to clear cart: ${clearCartError.message}`);
//       }

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000, style: { background: '#10b981', color: '#fff' } }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify that all items can be delivered to you.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is currently denied. Please enable it in your browser settings or enter a valid address below.'
//               : 'Please allow location access or click "Detect My Location".'}
//           </p>
//           {locationPermission === 'denied' && (
//             <div className="browser-instructions">
//               <p>Enable location permissions in your browser:</p>
//               <ul>
//                 <li>
//                   <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                   "Location" to "Allow".
//                 </li>
//                 <li>
//                   <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//                 </li>
//                 <li>
//                   <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//                 </li>
//                 <li>
//                   <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                   "Allow".
//                 </li>
//               </ul>
//             </div>
//           )}
//           <div className="location-buttons">
//             <button
//               ref={detectLocationButtonRef}
//               onClick={handleDetectLocation}
//               className="detect-location-btn prompt-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect My Location'
//               )}
//             </button>
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss location prompt"
//             >
//               Dismiss
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         {invalidProducts.length > 0 && (
//           <div className="invalid-products-warning" role="alert">
//             <p>
//               The following products are unavailable due to missing location data or being out of delivery range:{' '}
//               {invalidProducts.join(', ')}.{' '}
//               <button
//                 onClick={handleRemoveInvalidProducts}
//                 className="remove-invalid-btn"
//                 aria-label="Remove unavailable products from cart"
//               >
//                 Remove Unavailable Items
//               </button>
//             </p>
//           </div>
//         )}
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(userLocation, {
//                   latitude: p.latitude,
//                   longitude: p.longitude,
//                   delivery_radius_km: p.delivery_radius_km,
//                 })?.toFixed(2) || 'N/A'
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation, {
//                     latitude: p.latitude,
//                     longitude: p.longitude,
//                     delivery_radius_km: p.delivery_radius_km,
//                   }) <= p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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
//         {address ? (
//           <p className="detected-address">Detected: {address}</p>
//         ) : (
//           <p className="no-address">Please enter your address below or detect your location.</p>
//         )}
//         <label htmlFor="shipping-address" className="address-label">
//           Shipping Address
//         </label>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={(e) => handleManualAddressChange(e.target.value)}
//           placeholder="Enter your full address (e.g., Mdr055, 828126, Sudamdih, Jharia, Dhanbad, Jharkhand, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}
//         <div className="location-input-section">
//           <div className="location-buttons">
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect Location'
//               )}
//             </button>
//           </div>
//         </div>

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;




// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371; // Earth's radius for Haversine formula

// // Debounce utility for address validation
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper for API calls
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance between two coordinates using Haversine formula
// const calculateDistance = (userLoc, productLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     !productLoc?.delivery_radius_km ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return null; // Indicate invalid data
//   }
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((productLoc.latitude * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return EARTH_RADIUS_KM * c; // Distance in kilometers
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Manual address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 10) {
//       setAddressError('Please enter a complete address (at least 10 characters)');
//     } else if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//     } else if (!address.match(/.*,\s*\d{6},\s*.+,\s*.+,\s*.+,\s*India/)) {
//       setAddressError('Address must include street, postal code (6 digits), city, state, and country (India).');
//     } else {
//       setAddressError('');
//     }
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       const distance = calculateDistance(userLocation, {
//         latitude: product.latitude,
//         longitude: product.longitude,
//         delivery_radius_km: product.delivery_radius_km,
//       });
//       return distance !== null && distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Forward geocode using Mapbox to get coordinates from address
//   const forwardGeocode = useCallback(async (address) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,neighborhood&country=IN`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error(`Forward geocoding failed: ${resp.status} ${resp.statusText}`);
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       const feature = data.features?.[0];
//       if (feature?.geometry?.coordinates) {
//         const [lon, lat] = feature.geometry.coordinates;
//         return { lat, lon };
//       }
//       return null;
//     } catch (error) {
//       console.error('Forward geocoding error:', error);
//       toast.error('Failed to fetch coordinates from address.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Reverse geocode using Mapbox
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,neighborhood&country=IN`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error(`Reverse geocoding failed: ${resp.status} ${resp.statusText}`);
//           return resp.json();
//         });
//       const data = await retryRequest(fn);
//       return data.features?.[0]?.place_name || null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       toast.error('Failed to fetch address from coordinates.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return null;
//     }
//   }, []);

//   // Handle manual address change and geocode to coordinates
//   const handleManualAddressChange = useCallback(
//     async (newAddress) => {
//       setManualAddress(newAddress);
//       debouncedValidateManualAddress(newAddress);
//       if (newAddress && newAddress.trim().length >= 10 && !addressError) {
//         setLoading(true);
//         try {
//           const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};
//           if (geocodeCache[newAddress]) {
//             const coords = geocodeCache[newAddress];
//             setUserLocation(coords);
//             setBuyerLocation(coords);
//             localStorage.setItem('cachedLocation', JSON.stringify(coords));
//             toast.success('📍 Coordinates updated from cache!', {
//               duration: 4000,
//               style: { background: '#10b981', color: '#fff' },
//             });
//             return;
//           }
//           const coords = await forwardGeocode(newAddress);
//           if (coords) {
//             geocodeCache[newAddress] = coords;
//             localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
//             setUserLocation(coords);
//             setBuyerLocation(coords);
//             localStorage.setItem('cachedLocation', JSON.stringify(coords));
//             toast.success('📍 Coordinates updated from address!', {
//               duration: 4000,
//               style: { background: '#10b981', color: '#fff' },
//             });
//           } else {
//             setUserLocation(DEFAULT_LOCATION);
//             setBuyerLocation(DEFAULT_LOCATION);
//             localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//             toast.error('Could not fetch coordinates for this address. Using default location.', {
//               duration: 4000,
//               style: { background: '#ff4d4f', color: '#fff' },
//             });
//           }
//         } catch (error) {
//           console.error('Address geocoding error:', error);
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Failed to fetch coordinates for this address. Using default location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         } finally {
//           setLoading(false);
//         }
//       }
//     },
//     [debouncedValidateManualAddress, forwardGeocode, setBuyerLocation, addressError]
//   );

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Location access denied. Using default Jharia, Dhanbad location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button when prompt is shown
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
//       await fetchCartProducts(storedCart, (invalid) => {
//         if (invalid.length > 0) {
//           toast.error(
//             `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//             { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//           );
//         }
//       });
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     const cachedLocation = JSON.parse(localStorage.getItem('cachedLocation'));
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//       toast.error('Unable to detect location; using default Jharia, Dhanbad location.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError, reverseGeocode]);

//   // Detect user location
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
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
//       localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

//       const detectedAddress = await reverseGeocode(latitude, longitude);
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         localStorage.setItem('cachedAddress', detectedAddress);
//         toast.success('📍 Location and address detected successfully!', {
//           duration: 4000,
//           style: { background: '#10b981', color: '#fff' },
//         });
//         setShowLocationPrompt(false);
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not detect address from coordinates. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       console.error('Location detection error:', error);
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location permissions or enter address manually.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again or enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again or enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed with checkout';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError || !manualAddress || manualAddress.trim().length < 10)
//       return 'Please enter a valid shipping address';
//     if (!userLocation?.lat || !userLocation?.lon)
//       return 'Location coordinates are required to confirm your order';
//     if (!areProductsInRange()) return 'Some products are not available at your location';
//     return null;
//   }, [loading, session, products, cartItems, addressError, manualAddress, userLocation, areProductsInRange]);

//   // Remove invalid products from cart
//   const handleRemoveInvalidProducts = useCallback(() => {
//     const validCartItems = cartItems.filter((item) => {
//       const product = products.find((p) => p.cartId === item.id);
//       return product && product.latitude && product.longitude && product.delivery_radius_km;
//     });
//     setCartItems(validCartItems);
//     localStorage.setItem('cart', JSON.stringify(validCartItems));
//     toast.success('Removed unavailable products from cart.', {
//       duration: 4000,
//       style: { background: '#10b981', color: '#fff' },
//     });
//     fetchCartProducts(validCartItems, (invalid) => {
//       if (invalid.length > 0) {
//         toast.error(
//           `Some products (${invalid.join(', ')}) are unavailable due to missing location data or being out of delivery range. Please remove them.`,
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//       }
//     });
//   }, [cartItems, products, fetchCartProducts]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed with checkout', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!manualAddress || manualAddress.trim().length < 10 || addressError) {
//       toast.error('Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty. Please add items to proceed.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
//     if (!userLocation?.lat || !userLocation?.lon) {
//       console.error('Checkout attempted without userLocation:', userLocation);
//       toast.error(
//         'Location coordinates are required to confirm your order. Please detect your location or ensure your address is valid.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }
//     if (!areProductsInRange()) {
//       toast.error(
//         'Some products are not available for delivery at your location. Please check the delivery radius or remove unavailable items.',
//         { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       // Group products by seller_id
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Format shipping_location as WKT POINT with rounded coordinates
//         const shippingLocationWKT = userLocation
//           ? `POINT(${Number(userLocation.lon).toFixed(6)} ${Number(userLocation.lat).toFixed(6)})`
//           : null;

//         // Log order data for debugging
//         console.log('Inserting order with data:', {
//           user_id: session.user.id,
//           seller_id: sellerId,
//           total: sellerTotal,
//           shipping_address: manualAddress,
//           shipping_location: shippingLocationWKT,
//         });

//         // Insert order with shipping_location as WKT string
//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//           shipping_location: shippingLocationWKT,
//         };

//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert(orderData)
//             .select()
//             .single()
//         );
//         if (orderError) {
//           console.error('Order insertion error:', orderError);
//           if (orderError.code === '42501') {
//             throw new Error('Permission denied: Check RLS policies for the orders table.');
//           } else if (orderError.code === '404') {
//             throw new Error('Orders table not found: Ensure the table is exposed via the REST API.');
//           } else if (orderError.code === '42703') {
//             throw new Error('Database error: Invalid column reference in trigger function. Contact support.');
//           } else if (orderError.code === '400') {
//             throw new Error(`Bad request: ${orderError.message}. Check database triggers and data format.`);
//           }
//           throw new Error(`Order insertion error: ${orderError.message}`);
//         }

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             price_at_time: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
//         if (itemsError) {
//           console.error('Order items insertion error:', itemsError);
//           throw new Error(`Order items insertion error: ${itemsError.message}`);
//         }
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
//       if (clearCartError) {
//         console.error('Cart clearing error:', clearCartError);
//         throw new Error(`Failed to clear cart: ${clearCartError.message}`);
//       }

//       toast.success(
//         '🎉 Your order has been placed successfully! Thank you for shopping with Markeet. Your items will be delivered soon.',
//         { duration: 5000, style: { background: '#10b981', color: '#fff' } }
//       );
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('COD checkout error:', error);
//       toast.error(`Failed to place order: ${error.message || 'Please try again.'}`, {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate order total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="keywords" content="checkout, ecommerce, Markeet, cash on delivery" />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href="https://www.markeet.com/checkout" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify that all items can be delivered to you.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is currently denied. Please enable it in your browser settings or enter a valid address below.'
//               : 'Please allow location access or click "Detect My Location".'}
//           </p>
//           {locationPermission === 'denied' && (
//             <div className="browser-instructions">
//               <p>Enable location permissions in your browser:</p>
//               <ul>
//                 <li>
//                   <strong>Chrome</strong>: Click the lock icon in the address bar &gt; "Site settings" &gt; Set
//                   "Location" to "Allow".
//                 </li>
//                 <li>
//                   <strong>Firefox</strong>: Click the lock icon &gt; "Permissions" &gt; "Location" &gt; Select "Allow".
//                 </li>
//                 <li>
//                   <strong>Safari</strong>: Go to Safari &gt; Settings &gt; Websites &gt; Location &gt; Set to "Allow".
//                 </li>
//                 <li>
//                   <strong>Edge</strong>: Click the lock icon &gt; "Permissions for this site" &gt; Set "Location" to
//                   "Allow".
//                 </li>
//               </ul>
//             </div>
//           )}
//           <div className="location-buttons">
//             <button
//               ref={detectLocationButtonRef}
//               onClick={handleDetectLocation}
//               className="detect-location-btn prompt-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect My Location'
//               )}
//             </button>
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss location prompt"
//             >
//               Dismiss
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         {invalidProducts.length > 0 && (
//           <div className="invalid-products-warning" role="alert">
//             <p>
//               The following products are unavailable due to missing location data or being out of delivery range:{' '}
//               {invalidProducts.join(', ')}.{' '}
//               <button
//                 onClick={handleRemoveInvalidProducts}
//                 className="remove-invalid-btn"
//                 aria-label="Remove unavailable products from cart"
//               >
//                 Remove Unavailable Items
//               </button>
//             </p>
//           </div>
//         )}
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(userLocation, {
//                   latitude: p.latitude,
//                   longitude: p.longitude,
//                   delivery_radius_km: p.delivery_radius_km,
//                 })?.toFixed(2) || 'N/A'
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation, {
//                     latitude: p.latitude,
//                     longitude: p.longitude,
//                     delivery_radius_km: p.delivery_radius_km,
//                   }) <= p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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
//         {address ? (
//           <p className="detected-address">Detected: {address}</p>
//         ) : (
//           <p className="no-address">Please enter your address below or detect your location.</p>
//         )}
//         <label htmlFor="shipping-address" className="address-label">
//           Shipping Address
//         </label>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={(e) => handleManualAddressChange(e.target.value)}
//           placeholder="Enter your full address (e.g., Mdr055, 828126, Sudamdih, Jharia, Dhanbad, Jharkhand, India)"
//           rows="4"
//           className="address-textarea"
//           aria-label="Enter shipping address"
//           aria-describedby="address-error"
//           aria-invalid={!!addressError}
//         />
//         {addressError && (
//           <p id="address-error" className="address-error">
//             {addressError}
//           </p>
//         )}
//         <div className="location-input-section">
//           <div className="location-buttons">
//             <button
//               onClick={handleDetectLocation}
//               className="detect-location-btn"
//               disabled={loading}
//               aria-label="Detect my current location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect Location'
//               )}
//             </button>
//           </div>
//           {loading && <p className="geocoding-loading">Fetching coordinates...</p>}
//         </div>

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <p className="payment-method">Cash on Delivery</p>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;



// import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LocationContext } from '../App';
// import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
// import '../style/Checkout.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../supabaseClient';

// // Constants
// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
// const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 };
// const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
// const EARTH_RADIUS_KM = 6371;

// // Debounce utility
// const debounce = (func, delay) => {
//   let timeoutId;
//   return (...args) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// };

// // Retry helper
// const retryRequest = async (fn, maxAttempts = 3, initialDelay = 1000) => {
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
// };

// // Calculate distance using Haversine formula
// const calculateDistance = (userLoc, productLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     !productLoc?.delivery_radius_km ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((userLoc.lat * Math.PI) / 180) *
//     Math.cos((productLoc.latitude * Math.PI) / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return EARTH_RADIUS_KM * c;
// };

// function Checkout() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [address, setAddress] = useState('');
//   const [manualAddress, setManualAddress] = useState('');
//   const [addressError, setAddressError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [locationPermission, setLocationPermission] = useState(null);
//   const [showLocationPrompt, setShowLocationPrompt] = useState(false);
//   const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
//   const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
//   const navigate = useNavigate();
//   const detectLocationButtonRef = useRef(null);

//   // Enhanced address validation
//   const validateManualAddress = useCallback((address) => {
//     if (!address || address.trim().length < 15) {
//       setAddressError('Please enter a complete address with street, area, city, state, and pincode');
//       return false;
//     }
//     if (address.trim().length > 500) {
//       setAddressError('Address is too long. Keep under 500 characters.');
//       return false;
//     }
//     // Check for Indian pincode pattern (6 digits)
//     const pincodePattern = /\b\d{6}\b/;
//     if (!pincodePattern.test(address)) {
//       setAddressError('Address must include a valid 6-digit pincode');
//       return false;
//     }
//     // Check if address contains basic components
//     const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
//     if (parts.length < 3) {
//       setAddressError('Please provide a detailed address (street, area, city, state, pincode)');
//       return false;
//     }
//     setAddressError('');
//     return true;
//   }, []);

//   // Debounced address validation
//   const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

//   // Check if all products are within delivery radius
//   const areProductsInRange = useCallback(() => {
//     if (!userLocation || !products.length) return false;
//     return products.every((product) => {
//       const distance = calculateDistance(userLocation, {
//         latitude: product.latitude,
//         longitude: product.longitude,
//         delivery_radius_km: product.delivery_radius_km,
//       });
//       return distance !== null && distance <= product.delivery_radius_km;
//     });
//   }, [products, userLocation]);

//   // Check geolocation permission
//   const checkLocationPermission = useCallback(async () => {
//     if (!navigator.permissions || !navigator.permissions.query) {
//       return 'unknown';
//     }
//     try {
//       const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
//       setLocationPermission(permissionStatus.state);
//       setShowLocationPrompt(permissionStatus.state !== 'granted');
//       return permissionStatus.state;
//     } catch (e) {
//       console.error('Error checking geolocation permission:', e);
//       return 'unknown';
//     }
//   }, []);

//   // Enhanced forward geocode with multiple attempts for accuracy
//   const forwardGeocode = useCallback(async (address) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,postcode&country=IN&limit=1`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error(`Geocoding failed: ${resp.status}`);
//           return resp.json();
//         });
      
//       const data = await retryRequest(fn);
//       const feature = data.features?.[0];
      
//       if (feature?.geometry?.coordinates) {
//         const [lon, lat] = feature.geometry.coordinates;
//         const accuracy = feature.properties?.accuracy || 'unknown';
        
//         console.log('Geocoding result:', {
//           input: address,
//           output: feature.place_name,
//           coordinates: { lat, lon },
//           accuracy: accuracy
//         });
        
//         return { 
//           lat, 
//           lon, 
//           formattedAddress: feature.place_name,
//           accuracy: accuracy
//         };
//       }
//       return null;
//     } catch (error) {
//       console.error('Forward geocoding error:', error);
//       return null;
//     }
//   }, []);

//   // Enhanced reverse geocode for detailed address
//   const reverseGeocode = useCallback(async (lat, lon) => {
//     try {
//       const fn = () =>
//         fetch(
//           `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${
//             process.env.REACT_APP_MAPBOX_TOKEN
//           }&types=address,place,locality,postcode,district,region&country=IN&limit=1`,
//           { headers: { 'Accept': 'application/json' } }
//         ).then((resp) => {
//           if (!resp.ok) throw new Error(`Reverse geocoding failed: ${resp.status}`);
//           return resp.json();
//         });
      
//       const data = await retryRequest(fn);
//       const feature = data.features?.[0];
      
//       if (feature?.place_name) {
//         // Extract detailed address components
//         const context = feature.context || [];
//         const addressNumber = feature.address || '';
//         const street = feature.text || '';
//         const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
//         const place = context.find(c => c.id.startsWith('place'))?.text || '';
//         const district = context.find(c => c.id.startsWith('district'))?.text || '';
//         const region = context.find(c => c.id.startsWith('region'))?.text || '';
        
//         // Build comprehensive address
//         let detailedAddress = '';
//         if (addressNumber) detailedAddress += `${addressNumber} `;
//         if (street) detailedAddress += `${street}, `;
//         if (place) detailedAddress += `${place}, `;
//         if (postcode) detailedAddress += `${postcode}, `;
//         if (district) detailedAddress += `${district}, `;
//         if (region) detailedAddress += `${region}, `;
//         detailedAddress += 'India';
        
//         // Fallback to full place_name if detailed construction failed
//         const finalAddress = detailedAddress.length > 20 ? detailedAddress : feature.place_name;
        
//         console.log('Reverse geocoding result:', {
//           coordinates: { lat, lon },
//           address: finalAddress,
//           components: { addressNumber, street, place, postcode, district, region }
//         });
        
//         return finalAddress;
//       }
//       return null;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       return null;
//     }
//   }, []);

//   // Handle manual address change with enhanced geocoding
//   const handleManualAddressChange = useCallback(
//     async (newAddress) => {
//       setManualAddress(newAddress);
//       const isValid = validateManualAddress(newAddress);
      
//       if (isValid && newAddress.trim().length >= 15) {
//         setIsGeocodingAddress(true);
//         setLoading(true);
        
//         try {
//           // Check geocode cache
//           const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};
          
//           if (geocodeCache[newAddress]) {
//             const coords = geocodeCache[newAddress];
//             setUserLocation(coords);
//             setBuyerLocation(coords);
//             localStorage.setItem('cachedLocation', JSON.stringify(coords));
//             toast.success('📍 Using cached coordinates!', {
//               duration: 3000,
//               style: { background: '#10b981', color: '#fff' },
//             });
//             return;
//           }
          
//           // Geocode the address
//           const result = await forwardGeocode(newAddress);
          
//           if (result) {
//             const coords = { lat: result.lat, lon: result.lon };
            
//             // Cache the result
//             geocodeCache[newAddress] = coords;
//             localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
            
//             setUserLocation(coords);
//             setBuyerLocation(coords);
//             localStorage.setItem('cachedLocation', JSON.stringify(coords));
            
//             toast.success(`📍 Coordinates found with ${result.accuracy} accuracy!`, {
//               duration: 4000,
//               style: { background: '#10b981', color: '#fff' },
//             });
            
//             // Update with formatted address if available
//             if (result.formattedAddress && result.formattedAddress !== newAddress) {
//               setAddress(result.formattedAddress);
//             }
//           } else {
//             toast.error('Could not find coordinates for this address. Please verify the address.', {
//               duration: 4000,
//               style: { background: '#ff4d4f', color: '#fff' },
//             });
//             setUserLocation(DEFAULT_LOCATION);
//             setBuyerLocation(DEFAULT_LOCATION);
//             localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           }
//         } catch (error) {
//           console.error('Address geocoding error:', error);
//           toast.error('Failed to process address. Using default location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//         } finally {
//           setLoading(false);
//           setIsGeocodingAddress(false);
//         }
//       }
//     },
//     [validateManualAddress, forwardGeocode, setBuyerLocation]
//   );

//   // Monitor permission changes
//   useEffect(() => {
//     checkLocationPermission();
//     if (!navigator.permissions || !navigator.permissions.query) return;

//     let permissionStatus;
//     navigator.permissions.query({ name: 'geolocation' }).then((status) => {
//       permissionStatus = status;
//       setLocationPermission(status.state);
//       setShowLocationPrompt(status.state !== 'granted');
//       status.onchange = () => {
//         setLocationPermission(status.state);
//         setShowLocationPrompt(status.state !== 'granted');
//         if (status.state === 'granted') {
//           handleDetectLocation();
//         } else if (status.state === 'denied') {
//           setUserLocation(DEFAULT_LOCATION);
//           setBuyerLocation(DEFAULT_LOCATION);
//           setAddress(DEFAULT_ADDRESS);
//           setManualAddress(DEFAULT_ADDRESS);
//           localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//           localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//           toast.error('Location access denied. Using default location.', {
//             duration: 4000,
//             style: { background: '#ff4d4f', color: '#fff' },
//           });
//         }
//       };
//     });

//     return () => {
//       if (permissionStatus) permissionStatus.onchange = null;
//     };
//   }, [checkLocationPermission, setBuyerLocation]);

//   // Auto-focus detect location button
//   useEffect(() => {
//     if (showLocationPrompt && detectLocationButtonRef.current) {
//       detectLocationButtonRef.current.focus();
//     }
//   }, [showLocationPrompt]);

//   // Initialize cart and location
//   useEffect(() => {
//     const initializeCart = async () => {
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       if (storedCart.length === 0) return;
//       if (!userLocation) return;
      
//       await fetchCartProducts(storedCart, (invalid) => {
//         if (invalid.length > 0) {
//           toast.error(
//             `Some products are unavailable: ${invalid.join(', ')}`,
//             { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//           );
//         }
//       });
      
//       if (fetchError) {
//         toast.error(`Failed to load cart: ${fetchError}`, {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
//     };

//     const cachedAddress = localStorage.getItem('cachedAddress');
//     const cachedLocation = JSON.parse(localStorage.getItem('cachedLocation'));
    
//     if (buyerLocation) {
//       setUserLocation(buyerLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       } else {
//         reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((detectedAddress) => {
//           const addr = detectedAddress || DEFAULT_ADDRESS;
//           setAddress(addr);
//           setManualAddress(addr);
//           localStorage.setItem('cachedAddress', addr);
//         });
//       }
//     } else if (cachedLocation) {
//       setUserLocation(cachedLocation);
//       setBuyerLocation(cachedLocation);
//       if (cachedAddress) {
//         setAddress(cachedAddress);
//         setManualAddress(cachedAddress);
//       }
//     } else {
//       setUserLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     }

//     initializeCart();
//   }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError, reverseGeocode]);

//   // Enhanced location detection with high accuracy
//   const handleDetectLocation = useCallback(async () => {
//     if (!navigator.geolocation) {
//       toast.error('Geolocation is not supported by this browser.', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
    
//     setLoading(true);
//     toast.loading('Detecting your precise location...', { id: 'location-detect' });
    
//     try {
//       const position = await new Promise((resolve, reject) =>
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         })
//       );

//       const { latitude, longitude, accuracy } = position.coords;
//       const newLocation = { lat: latitude, lon: longitude };
      
//       console.log('Location detected:', {
//         coordinates: newLocation,
//         accuracy: `${accuracy}m`
//       });
      
//       setBuyerLocation(newLocation);
//       setUserLocation(newLocation);
//       localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

//       toast.dismiss('location-detect');
//       toast.loading('Fetching detailed address...', { id: 'address-fetch' });
      
//       const detectedAddress = await reverseGeocode(latitude, longitude);
      
//       toast.dismiss('address-fetch');
      
//       if (detectedAddress) {
//         setAddress(detectedAddress);
//         setManualAddress(detectedAddress);
//         localStorage.setItem('cachedAddress', detectedAddress);
        
//         toast.success(`📍 Location detected with ${accuracy.toFixed(0)}m accuracy!`, {
//           duration: 5000,
//           style: { background: '#10b981', color: '#fff' },
//         });
        
//         setShowLocationPrompt(false);
        
//         if (products.length > 0 && areProductsInRange()) {
//           toast.success('✅ All products are within delivery range!', {
//             duration: 4000,
//             style: { background: '#10b981', color: '#fff' },
//           });
//         }
//       } else {
//         toast.error('Could not fetch address. Please enter manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//         setAddress(DEFAULT_ADDRESS);
//         setManualAddress(DEFAULT_ADDRESS);
//         localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       }
//     } catch (error) {
//       toast.dismiss('location-detect');
//       toast.dismiss('address-fetch');
//       console.error('Location detection error:', error);
      
//       if (error.code === 1) {
//         toast.error(
//           'Location access denied. Please enable location or enter address manually.',
//           { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
//         );
//         setLocationPermission('denied');
//         setShowLocationPrompt(true);
//       } else if (error.code === 2) {
//         toast.error('Location unavailable. Please try again or enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else if (error.code === 3) {
//         toast.error('Location request timed out. Please try again.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       } else {
//         toast.error('Failed to detect location. Please enter address manually.', {
//           duration: 4000,
//           style: { background: '#ff4d4f', color: '#fff' },
//         });
//       }
      
//       setUserLocation(DEFAULT_LOCATION);
//       setBuyerLocation(DEFAULT_LOCATION);
//       setAddress(DEFAULT_ADDRESS);
//       setManualAddress(DEFAULT_ADDRESS);
//       localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
//       localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
//     } finally {
//       setLoading(false);
//     }
//   }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

//   // Get reason for disabled Place Order button
//   const getDisabledReason = useCallback(() => {
//     if (loading || isGeocodingAddress) return 'Processing, please wait...';
//     if (!session?.user?.id) return 'Please log in to proceed';
//     if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
//     if (addressError) return addressError;
//     if (!manualAddress || manualAddress.trim().length < 15) return 'Please enter a complete delivery address';
//     if (!userLocation?.lat || !userLocation?.lon) return 'Address coordinates not found. Please verify address.';
//     if (!areProductsInRange()) return 'Some products cannot be delivered to your location';
//     return null;
//   }, [loading, isGeocodingAddress, session, products, cartItems, addressError, manualAddress, userLocation, areProductsInRange]);

//   // Remove invalid products
//   const handleRemoveInvalidProducts = useCallback(() => {
//     const validCartItems = cartItems.filter((item) => {
//       const product = products.find((p) => p.cartId === item.id);
//       return product && product.latitude && product.longitude && product.delivery_radius_km;
//     });
//     setCartItems(validCartItems);
//     localStorage.setItem('cart', JSON.stringify(validCartItems));
//     toast.success('Removed unavailable products from cart.', {
//       duration: 4000,
//       style: { background: '#10b981', color: '#fff' },
//     });
//     fetchCartProducts(validCartItems);
//   }, [cartItems, products, fetchCartProducts]);

//   // Cash on Delivery checkout
//   const handleCheckout = async () => {
//     if (!session?.user?.id) {
//       toast.error('Please log in to proceed', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       navigate('/auth');
//       return;
//     }
    
//     if (!validateManualAddress(manualAddress)) {
//       toast.error(addressError || 'Please enter a valid shipping address', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
    
//     if (products.length === 0 || cartItems.length === 0) {
//       toast.error('Your cart is empty', {
//         duration: 4000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
    
//     if (!userLocation?.lat || !userLocation?.lon) {
//       toast.error('Location coordinates required. Please verify your address.', {
//         duration: 6000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }
    
//     if (!areProductsInRange()) {
//       toast.error('Some products cannot be delivered to your location.', {
//         duration: 6000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//       return;
//     }

//     setLoading(true);
    
//     try {
//       // Group products by seller
//       const ordersBySeller = products.reduce((acc, product) => {
//         const sellerId = product.seller_id;
//         if (!acc[sellerId]) acc[sellerId] = [];
//         acc[sellerId].push(product);
//         return acc;
//       }, {});

//       for (const sellerId of Object.keys(ordersBySeller)) {
//         const sellerProducts = ordersBySeller[sellerId];
//         const sellerTotal = sellerProducts.reduce((sum, product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           const price = product.selectedVariant?.price || product.price || 0;
//           const qty = cartItem?.quantity || 1;
//           return sum + (Number.isFinite(price) ? price * qty : 0);
//         }, 0);

//         // Format shipping_location as WKT POINT with 6 decimal precision
//         const shippingLocationWKT = userLocation
//           ? `POINT(${Number(userLocation.lon).toFixed(6)} ${Number(userLocation.lat).toFixed(6)})`
//           : null;

//         console.log('Creating order:', {
//           seller_id: sellerId,
//           total: sellerTotal,
//           address: manualAddress,
//           location: shippingLocationWKT,
//         });

//         const orderData = {
//           user_id: session.user.id,
//           total: sellerTotal,
//           total_amount: sellerTotal,
//           order_status: 'Order Placed',
//           payment_method: 'cash_on_delivery',
//           shipping_address: manualAddress,
//           created_at: new Date().toISOString(),
//           seller_id: sellerId,
//           shipping_location: shippingLocationWKT,
//         };

//         const { data: order, error: orderError } = await retryRequest(() =>
//           supabase
//             .from('orders')
//             .insert(orderData)
//             .select()
//             .single()
//         );
        
//         if (orderError) {
//           console.error('Order insertion error:', orderError);
//           throw new Error(`Order creation failed: ${orderError.message}`);
//         }

//         // Insert order items
//         const orderItems = sellerProducts.map((product) => {
//           const cartItem = cartItems.find((item) => item.id === product.cartId);
//           return {
//             order_id: order.id,
//             product_id: product.id,
//             quantity: cartItem?.quantity || 1,
//             price: product.selectedVariant?.price || product.price || 0,
//             variant_id: product.selectedVariant?.id || null,
//           };
//         });
        
//         const { error: itemsError } = await retryRequest(() =>
//           supabase.from('order_items').insert(orderItems)
//         );
        
//         if (itemsError) {
//           console.error('Order items error:', itemsError);
//           throw new Error(`Failed to save order items: ${itemsError.message}`);
//         }
//       }

//       // Clear cart
//       const { error: clearCartError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', session.user.id)
//       );
      
//       if (clearCartError) {
//         console.warn('Cart clearing error:', clearCartError);
//       }

//       toast.success('🎉 Order placed successfully! Thank you for shopping with Markeet.', {
//         duration: 5000,
//         style: { background: '#10b981', color: '#fff' },
//       });
      
//       localStorage.setItem('cart', JSON.stringify([]));
//       setCartItems([]);
//       navigate('/account');
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error(`Failed to place order: ${error.message}`, {
//         duration: 5000,
//         style: { background: '#ff4d4f', color: '#fff' },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate total
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => item.id === product.cartId);
//     const price = product.selectedVariant?.price || product.price || 0;
//     const qty = cartItem?.quantity || 1;
//     return sum + (Number.isFinite(price) ? price * qty : 0);
//   }, 0);

//   if (fetchLoading && products.length === 0) {
//     return (
//       <div className="loading-container" aria-live="polite">
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
//         <button
//           onClick={() => navigate('/')}
//           className="continue-shopping-btn"
//           aria-label="Continue shopping"
//         >
//           🛍️ Continue Shopping
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="checkout-container fade-in">
//       <Helmet>
//         <title>Checkout - Markeet</title>
//         <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
//         <meta name="robots" content="noindex, follow" />
//       </Helmet>

//       <div className="checkout-header slide-up">
//         <h1>🛒 Secure Checkout</h1>
//         <p>Complete your purchase with Cash on Delivery</p>
//       </div>

//       {showLocationPrompt && (
//         <div className="location-prompt" role="alert" aria-live="assertive">
//           <h3>📍 Location Access Required</h3>
//           <p>
//             We need your location to verify delivery availability.{' '}
//             {locationPermission === 'denied'
//               ? 'Location access is denied. Please enable it in browser settings or enter your address manually.'
//               : 'Please allow location access or enter your address manually.'}
//           </p>
//           <div className="location-buttons">
//             <button
//               ref={detectLocationButtonRef}
//               onClick={handleDetectLocation}
//               className="detect-location-btn prompt-btn"
//               disabled={loading}
//               aria-label="Detect location"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Detecting...
//                 </>
//               ) : (
//                 '📍 Detect My Location'
//               )}
//             </button>
//             <button
//               onClick={() => setShowLocationPrompt(false)}
//               className="dismiss-prompt-btn"
//               aria-label="Dismiss prompt"
//             >
//               Dismiss
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="cart-items-section">
//         <h2 className="cart-items-title">Items in Cart</h2>
//         {invalidProducts.length > 0 && (
//           <div className="invalid-products-warning" role="alert">
//             <p>
//               Unavailable products: {invalidProducts.join(', ')}.{' '}
//               <button
//                 onClick={handleRemoveInvalidProducts}
//                 className="remove-invalid-btn"
//                 aria-label="Remove unavailable products"
//               >
//                 Remove Unavailable Items
//               </button>
//             </p>
//           </div>
//         )}
//         <div className="cart-items-list">
//           {products.map((p) => {
//             const cartItem = cartItems.find((item) => item.id === p.cartId);
//             const qty = cartItem?.quantity || 1;
//             const price = p.selectedVariant?.price || p.price || 0;
//             const attrs = p.selectedVariant?.attributes
//               ? Object.entries(p.selectedVariant.attributes)
//                   .map(([k, v]) => `${k}: ${v}`)
//                   .join(', ')
//               : null;
//             const distance = userLocation
//               ? calculateDistance(userLocation, {
//                   latitude: p.latitude,
//                   longitude: p.longitude,
//                   delivery_radius_km: p.delivery_radius_km,
//                 })?.toFixed(2) || 'N/A'
//               : 'N/A';
//             const inRange =
//               userLocation && p.latitude && p.longitude && p.delivery_radius_km
//                 ? calculateDistance(userLocation, {
//                     latitude: p.latitude,
//                     longitude: p.longitude,
//                     delivery_radius_km: p.delivery_radius_km,
//                   }) <= p.delivery_radius_km
//                 : false;

//             return (
//               <div key={p.uniqueKey} className="checkout-item">
//                 <img
//                   src={p.images?.[0] || DEFAULT_IMAGE}
//                   alt={p.title || 'Unnamed Product'}
//                   onError={(e) => {
//                     e.target.src = DEFAULT_IMAGE;
//                   }}
//                   className="checkout-item-image"
//                   loading="lazy"
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
//                     Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   <p>
//                     Distance to Seller: {distance} km{' '}
//                     {p.delivery_radius_km && (
//                       <span className={inRange ? 'in-range' : 'out-of-range'}>
//                         ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
//                       </span>
//                     )}
//                     {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
//                       <span className="out-of-range"> (Location data missing)</span>
//                     ) : null}
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

//         <h3 className="checkout-section-title">📍 Delivery Address</h3>
//         {address && (
//           <div className="detected-address-box">
//             <p className="detected-address-label">Detected Address:</p>
//             <p className="detected-address">{address}</p>
//           </div>
//         )}
        
//         <label htmlFor="shipping-address" className="address-label">
//           Complete Delivery Address <span className="required-asterisk">*</span>
//         </label>
//         <p className="address-hint">
//           Include: House/Flat No., Street, Area/Locality, City, State, Pincode
//         </p>
//         <textarea
//           id="shipping-address"
//           value={manualAddress}
//           onChange={(e) => handleManualAddressChange(e.target.value)}
//           placeholder="Example: Flat 301, Building A, Green Valley Apartments, Sector 5, Salt Lake, Kolkata, West Bengal, 700091, India"
//           rows="5"
//           className="address-textarea"
//           aria-label="Enter complete shipping address"
//           aria-describedby="address-error address-hint"
//           aria-invalid={!!addressError}
//           aria-required="true"
//         />
//         {addressError && (
//           <p id="address-error" className="address-error" role="alert">
//             ⚠️ {addressError}
//           </p>
//         )}
//         {isGeocodingAddress && (
//           <p className="geocoding-status">
//             <span className="spinner small"></span> Verifying address and fetching coordinates...
//           </p>
//         )}
        
//         <div className="location-input-section">
//           <button
//             onClick={handleDetectLocation}
//             className="detect-location-btn"
//             disabled={loading || isGeocodingAddress}
//             aria-label="Detect my current location"
//           >
//             {loading ? (
//               <>
//                 <span className="spinner small"></span> Detecting...
//               </>
//             ) : (
//               '📍 Auto-Detect My Location'
//             )}
//           </button>
          
//           {userLocation && userLocation.lat && userLocation.lon && (
//             <div className="location-info">
//               <p className="location-verified">
//                 ✓ Location verified • Coordinates secured
//               </p>
//             </div>
//           )}
//         </div>

//         <h3 className="checkout-section-title">💵 Payment Method</h3>
//         <div className="payment-method-box">
//           <p className="payment-method">Cash on Delivery (COD)</p>
//           <p className="payment-method-desc">Pay with cash when your order is delivered</p>
//         </div>

//         <div className="checkout-action">
//           <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
//             <button
//               onClick={handleCheckout}
//               className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
//               disabled={!!getDisabledReason()}
//               aria-label="Place order with Cash on Delivery"
//               aria-busy={loading}
//               aria-describedby="place-order-error"
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner small"></span> Processing Order...
//                 </>
//               ) : (
//                 '💵 Place Order (Cash on Delivery)'
//               )}
//             </button>
//             {getDisabledReason() && (
//               <p id="place-order-error" className="place-order-error" role="alert">
//                 {getDisabledReason()}
//               </p>
//             )}
//           </div>
//         </div>
        
//         <div className="checkout-footer-info">
//           <p>🔒 Your personal information is secure</p>
//           <p>📦 Orders typically arrive within 3-5 business days</p>
//           <p>📍 Delivery only available within seller's specified radius</p>
//         </div>
//       </div>

//       <Footer />
//     </div>
//   );
// }

// export default Checkout;




import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationContext } from '../App';
import { useFetchCartProducts } from '../hooks/useFetchCartProducts';
import '../style/Checkout.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

// Constants
const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 };
const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
const EARTH_RADIUS_KM = 6371;

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Retry helper
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

// Calculate distance using Haversine formula
const calculateDistance = (userLoc, productLoc) => {
  if (
    !userLoc?.lat ||
    !userLoc?.lon ||
    !productLoc?.latitude ||
    !productLoc?.longitude ||
    !productLoc?.delivery_radius_km ||
    productLoc.latitude === 0 ||
    productLoc.longitude === 0
  ) {
    return null;
  }
  const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLoc.lat * Math.PI) / 180) *
    Math.cos((productLoc.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

function Checkout() {
  const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressDetails, setAddressDetails] = useState(null); // New state for detailed address and accuracy
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const { fetchCartProducts, products, loading: fetchLoading, error: fetchError, invalidProducts } = useFetchCartProducts(userLocation);
  const navigate = useNavigate();
  const detectLocationButtonRef = useRef(null);

  // Enhanced address validation
  const validateManualAddress = useCallback((address) => {
    if (!address || address.trim().length < 15) {
      setAddressError('Please enter a complete address with street, area, city, state, and pincode');
      return false;
    }
    if (address.trim().length > 500) {
      setAddressError('Address is too long. Keep under 500 characters.');
      return false;
    }
    const pincodePattern = /\b\d{6}\b/;
    if (!pincodePattern.test(address)) {
      setAddressError('Address must include a valid 6-digit pincode');
      return false;
    }
    const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length < 3) {
      setAddressError('Please provide a detailed address (street, area, city, state, pincode)');
      return false;
    }
    setAddressError('');
    return true;
  }, []);

  // Debounced address validation
  const debouncedValidateManualAddress = debounce(validateManualAddress, 500);

  // Check if all products are within delivery radius
  const areProductsInRange = useCallback(() => {
    if (!userLocation || !products.length) return false;
    return products.every((product) => {
      const distance = calculateDistance(userLocation, {
        latitude: product.latitude,
        longitude: product.longitude,
        delivery_radius_km: product.delivery_radius_km,
      });
      return distance !== null && distance <= product.delivery_radius_km;
    });
  }, [products, userLocation]);

  // Check geolocation permission
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unknown';
    }
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permissionStatus.state);
      setShowLocationPrompt(permissionStatus.state !== 'granted');
      return permissionStatus.state;
    } catch (e) {
      console.error('Error checking geolocation permission:', e);
      return 'unknown';
    }
  }, []);

  // Enhanced forward geocode
  const forwardGeocode = useCallback(async (address) => {
    try {
      const fn = () =>
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${
            process.env.REACT_APP_MAPBOX_TOKEN
          }&types=address,place,locality,postcode&country=IN&limit=1`,
          { headers: { 'Accept': 'application/json' } }
        ).then((resp) => {
          if (!resp.ok) throw new Error(`Geocoding failed: ${resp.status}`);
          return resp.json();
        });

      const data = await retryRequest(fn);
      const feature = data.features?.[0];

      if (feature?.geometry?.coordinates) {
        const [lon, lat] = feature.geometry.coordinates;
        const context = feature.context || [];
        const addressNumber = feature.address || '';
        const street = feature.text || '';
        const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
        const place = context.find(c => c.id.startsWith('place'))?.text || '';
        const district = context.find(c => c.id.startsWith('district'))?.text || '';
        const region = context.find(c => c.id.startsWith('region'))?.text || '';
        const accuracy = feature.properties?.accuracy || 'unknown';

        // Build detailed address
        let detailedAddress = '';
        if (addressNumber) detailedAddress += `${addressNumber}, `;
        if (street) detailedAddress += `${street}, `;
        if (place) detailedAddress += `${place}, `;
        if (postcode) detailedAddress += `${postcode}, `;
        if (district) detailedAddress += `${district}, `;
        if (region) detailedAddress += `${region}, `;
        detailedAddress += 'India';

        console.log('Forward geocoding result:', {
          input: address,
          output: feature.place_name,
          coordinates: { lat, lon },
          accuracy: accuracy,
          components: { addressNumber, street, place, postcode, district, region }
        });

        return {
          lat,
          lon,
          formattedAddress: detailedAddress.length > 20 ? detailedAddress : feature.place_name,
          accuracy: accuracy,
          components: { addressNumber, street, place, postcode, district, region }
        };
      }
      return null;
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }, []);

  // Enhanced reverse geocode
  const reverseGeocode = useCallback(async (lat, lon) => {
    try {
      const fn = () =>
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${
            process.env.REACT_APP_MAPBOX_TOKEN
          }&types=address,place,locality,postcode,district,region&country=IN&limit=1`,
          { headers: { 'Accept': 'application/json' } }
        ).then((resp) => {
          if (!resp.ok) throw new Error(`Reverse geocoding failed: ${resp.status}`);
          return resp.json();
        });

      const data = await retryRequest(fn);
      const feature = data.features?.[0];

      if (feature?.place_name) {
        const context = feature.context || [];
        const addressNumber = feature.address || '';
        const street = feature.text || '';
        const postcode = context.find(c => c.id.startsWith('postcode'))?.text || '';
        const place = context.find(c => c.id.startsWith('place'))?.text || '';
        const district = context.find(c => c.id.startsWith('district'))?.text || '';
        const region = context.find(c => c.id.startsWith('region'))?.text || '';
        const accuracy = feature.properties?.accuracy || 'unknown';

        let detailedAddress = '';
        if (addressNumber) detailedAddress += `${addressNumber}, `;
        if (street) detailedAddress += `${street}, `;
        if (place) detailedAddress += `${place}, `;
        if (postcode) detailedAddress += `${postcode}, `;
        if (district) detailedAddress += `${district}, `;
        if (region) detailedAddress += `${region}, `;
        detailedAddress += 'India';

        const finalAddress = detailedAddress.length > 20 ? detailedAddress : feature.place_name;

        console.log('Reverse geocoding result:', {
          coordinates: { lat, lon },
          address: finalAddress,
          accuracy: accuracy,
          components: { addressNumber, street, place, postcode, district, region }
        });

        return {
          formattedAddress: finalAddress,
          accuracy: accuracy,
          components: { addressNumber, street, place, postcode, district, region }
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }, []);

  // Handle manual address change
  const handleManualAddressChange = useCallback(
    async (newAddress) => {
      setManualAddress(newAddress);
      const isValid = validateManualAddress(newAddress);

      if (isValid && newAddress.trim().length >= 15) {
        setIsGeocodingAddress(true);
        setLoading(true);

        try {
          const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};

          if (geocodeCache[newAddress]) {
            const cachedData = geocodeCache[newAddress];
            setUserLocation({ lat: cachedData.lat, lon: cachedData.lon });
            setBuyerLocation({ lat: cachedData.lat, lon: cachedData.lon });
            setAddressDetails(cachedData);
            localStorage.setItem('cachedLocation', JSON.stringify({ lat: cachedData.lat, lon: cachedData.lon }));
            toast.success('📍 Using cached location details!', {
              duration: 3000,
              style: { background: '#10b981', color: '#fff' }
            });
            return;
          }

          const result = await forwardGeocode(newAddress);

          if (result) {
            const coords = { lat: result.lat, lon: result.lon };
            geocodeCache[newAddress] = { ...result, lat: result.lat, lon: result.lon };
            localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
            setUserLocation(coords);
            setBuyerLocation(coords);
            setAddressDetails(result);
            localStorage.setItem('cachedLocation', JSON.stringify(coords));
            setAddress(result.formattedAddress);
            toast.success(`📍 Location verified with ${result.accuracy} accuracy!`, {
              duration: 4000,
              style: { background: '#10b981', color: '#fff' }
            });
          } else {
            toast.error('Could not find coordinates for this address. Please verify.', {
              duration: 4000,
              style: { background: '#ff4d4f', color: '#fff' }
            });
            setUserLocation(DEFAULT_LOCATION);
            setBuyerLocation(DEFAULT_LOCATION);
            setAddressDetails(null);
            setAddress(DEFAULT_ADDRESS);
            localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
          }
        } catch (error) {
          console.error('Address geocoding error:', error);
          toast.error('Failed to process address. Using default location.', {
            duration: 4000,
            style: { background: '#ff4d4f', color: '#fff' }
          });
          setUserLocation(DEFAULT_LOCATION);
          setBuyerLocation(DEFAULT_LOCATION);
          setAddressDetails(null);
          setAddress(DEFAULT_ADDRESS);
          localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
        } finally {
          setLoading(false);
          setIsGeocodingAddress(false);
        }
      }
    },
    [validateManualAddress, forwardGeocode, setBuyerLocation]
  );

  // Monitor permission changes
  useEffect(() => {
    checkLocationPermission();
    if (!navigator.permissions || !navigator.permissions.query) return;

    let permissionStatus;
    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      permissionStatus = status;
      setLocationPermission(status.state);
      setShowLocationPrompt(status.state !== 'granted');
      status.onchange = () => {
        setLocationPermission(status.state);
        setShowLocationPrompt(status.state !== 'granted');
        if (status.state === 'granted') {
          handleDetectLocation();
        } else if (status.state === 'denied') {
          setUserLocation(DEFAULT_LOCATION);
          setBuyerLocation(DEFAULT_LOCATION);
          setAddress(DEFAULT_ADDRESS);
          setManualAddress(DEFAULT_ADDRESS);
          setAddressDetails(null);
          localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
          localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
          toast.error('Location access denied. Using default location.', {
            duration: 4000,
            style: { background: '#ff4d4f', color: '#fff' }
          });
        }
      };
    });

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [checkLocationPermission, setBuyerLocation]);

  // Auto-focus detect location button
  useEffect(() => {
    if (showLocationPrompt && detectLocationButtonRef.current) {
      detectLocationButtonRef.current.focus();
    }
  }, [showLocationPrompt]);

  // Initialize cart and location
  useEffect(() => {
    const initializeCart = async () => {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);

      if (storedCart.length === 0) return;
      if (!userLocation) return;

      await fetchCartProducts(storedCart, (invalid) => {
        if (invalid.length > 0) {
          toast.error(
            `Some products are unavailable: ${invalid.join(', ')}`,
            { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
          );
        }
      });

      if (fetchError) {
        toast.error(`Failed to load cart: ${fetchError}`, {
          duration: 4000,
          style: { background: '#ff4d4f', color: '#fff' }
        });
      }
    };

    const cachedAddress = localStorage.getItem('cachedAddress');
    const cachedLocation = JSON.parse(localStorage.getItem('cachedLocation'));

    if (buyerLocation) {
      setUserLocation(buyerLocation);
      if (cachedAddress) {
        setAddress(cachedAddress);
        setManualAddress(cachedAddress);
        // Attempt to load cached address details
        const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};
        if (geocodeCache[cachedAddress]) {
          setAddressDetails(geocodeCache[cachedAddress]);
        }
      } else {
        reverseGeocode(buyerLocation.lat, buyerLocation.lon).then((result) => {
          const addr = result?.formattedAddress || DEFAULT_ADDRESS;
          setAddress(addr);
          setManualAddress(addr);
          setAddressDetails(result);
          localStorage.setItem('cachedAddress', addr);
        });
      }
    } else if (cachedLocation) {
      setUserLocation(cachedLocation);
      setBuyerLocation(cachedLocation);
      if (cachedAddress) {
        setAddress(cachedAddress);
        setManualAddress(cachedAddress);
        const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};
        if (geocodeCache[cachedAddress]) {
          setAddressDetails(geocodeCache[cachedAddress]);
        }
      }
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setBuyerLocation(DEFAULT_LOCATION);
      setAddress(DEFAULT_ADDRESS);
      setManualAddress(DEFAULT_ADDRESS);
      setAddressDetails(null);
      localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
      localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
    }

    initializeCart();
  }, [buyerLocation, userLocation, fetchCartProducts, setBuyerLocation, fetchError, reverseGeocode]);

  // Enhanced location detection
  const handleDetectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.', {
        duration: 4000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      return;
    }

    setLoading(true);
    toast.loading('Detecting your precise location...', { id: 'location-detect' });

    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })
      );

      const { latitude, longitude, accuracy } = position.coords;
      const newLocation = { lat: latitude, lon: longitude };

      console.log('Location detected:', {
        coordinates: newLocation,
        accuracy: `${accuracy}m`
      });

      setBuyerLocation(newLocation);
      setUserLocation(newLocation);
      localStorage.setItem('cachedLocation', JSON.stringify(newLocation));

      toast.dismiss('location-detect');
      toast.loading('Fetching detailed address...', { id: 'address-fetch' });

      const result = await reverseGeocode(latitude, longitude);

      toast.dismiss('address-fetch');

      if (result) {
        setAddress(result.formattedAddress);
        setManualAddress(result.formattedAddress);
        setAddressDetails({ ...result, geolocationAccuracy: accuracy });
        localStorage.setItem('cachedAddress', result.formattedAddress);
        const geocodeCache = JSON.parse(localStorage.getItem('geocodeCache')) || {};
        geocodeCache[result.formattedAddress] = { ...result, lat: latitude, lon: longitude };
        localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));

        toast.success(`📍 Location detected with ${accuracy.toFixed(0)}m accuracy!`, {
          duration: 5000,
          style: { background: '#10b981', color: '#fff' }
        });

        setShowLocationPrompt(false);

        if (products.length > 0 && areProductsInRange()) {
          toast.success('✅ All products are within delivery range!', {
            duration: 4000,
            style: { background: '#10b981', color: '#fff' }
          });
        }
      } else {
        toast.error('Could not fetch address. Please enter manually.', {
          duration: 4000,
          style: { background: '#ff4d4f', color: '#fff' }
        });
        setAddress(DEFAULT_ADDRESS);
        setManualAddress(DEFAULT_ADDRESS);
        setAddressDetails(null);
        localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
      }
    } catch (error) {
      toast.dismiss('location-detect');
      toast.dismiss('address-fetch');
      console.error('Location detection error:', error);

      if (error.code === 1) {
        toast.error(
          'Location access denied. Please enable location or enter address manually.',
          { duration: 6000, style: { background: '#ff4d4f', color: '#fff' } }
        );
        setLocationPermission('denied');
        setShowLocationPrompt(true);
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please try again or enter address manually.', {
          duration: 4000,
          style: { background: '#ff4d4f', color: '#fff' }
        });
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again.', {
          duration: 4000,
          style: { background: '#ff4d4f', color: '#fff' }
        });
      } else {
        toast.error('Failed to detect location. Please enter address manually.', {
          duration: 4000,
          style: { background: '#ff4d4f', color: '#fff' }
        });
      }

      setUserLocation(DEFAULT_LOCATION);
      setBuyerLocation(DEFAULT_LOCATION);
      setAddress(DEFAULT_ADDRESS);
      setManualAddress(DEFAULT_ADDRESS);
      setAddressDetails(null);
      localStorage.setItem('cachedAddress', DEFAULT_ADDRESS);
      localStorage.setItem('cachedLocation', JSON.stringify(DEFAULT_LOCATION));
    } finally {
      setLoading(false);
    }
  }, [reverseGeocode, setBuyerLocation, products, areProductsInRange]);

  // Get reason for disabled Place Order button
  const getDisabledReason = useCallback(() => {
    if (loading || isGeocodingAddress) return 'Processing, please wait...';
    if (!session?.user?.id) return 'Please log in to proceed';
    if (products.length === 0 || cartItems.length === 0) return 'Your cart is empty';
    if (addressError) return addressError;
    if (!manualAddress || manualAddress.trim().length < 15) return 'Please enter a complete delivery address';
    if (!userLocation?.lat || !userLocation?.lon) return 'Address coordinates not found. Please verify address.';
    if (!areProductsInRange()) return 'Some products cannot be delivered to your location';
    return null;
  }, [loading, isGeocodingAddress, session, products, cartItems, addressError, manualAddress, userLocation, areProductsInRange]);

  // Remove invalid products
  const handleRemoveInvalidProducts = useCallback(() => {
    const validCartItems = cartItems.filter((item) => {
      const product = products.find((p) => p.cartId === item.id);
      return product && product.latitude && product.longitude && product.delivery_radius_km;
    });
    setCartItems(validCartItems);
    localStorage.setItem('cart', JSON.stringify(validCartItems));
    toast.success('Removed unavailable products from cart.', {
      duration: 4000,
      style: { background: '#10b981', color: '#fff' }
    });
    fetchCartProducts(validCartItems);
  }, [cartItems, products, fetchCartProducts]);

  // Cash on Delivery checkout
  const handleCheckout = async () => {
    if (!session?.user?.id) {
      toast.error('Please log in to proceed', {
        duration: 4000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      navigate('/auth');
      return;
    }

    if (!validateManualAddress(manualAddress)) {
      toast.error(addressError || 'Please enter a valid shipping address', {
        duration: 4000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      return;
    }

    if (products.length === 0 || cartItems.length === 0) {
      toast.error('Your cart is empty', {
        duration: 4000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      return;
    }

    if (!userLocation?.lat || !userLocation?.lon) {
      toast.error('Location coordinates required. Please verify your address.', {
        duration: 6000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      return;
    }

    if (!areProductsInRange()) {
      toast.error('Some products cannot be delivered to your location.', {
        duration: 6000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
      return;
    }

    setLoading(true);

    try {
      const ordersBySeller = products.reduce((acc, product) => {
        const sellerId = product.seller_id;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(product);
        return acc;
      }, {});

      for (const sellerId of Object.keys(ordersBySeller)) {
        const sellerProducts = ordersBySeller[sellerId];
        const sellerTotal = sellerProducts.reduce((sum, product) => {
          const cartItem = cartItems.find((item) => item.id === product.cartId);
          const price = product.selectedVariant?.price || product.price || 0;
          const qty = cartItem?.quantity || 1;
          return sum + (Number.isFinite(price) ? price * qty : 0);
        }, 0);

        const shippingLocationWKT = userLocation
          ? `POINT(${Number(userLocation.lon).toFixed(6)} ${Number(userLocation.lat).toFixed(6)})`
          : null;

        console.log('Creating order:', {
          seller_id: sellerId,
          total: sellerTotal,
          address: manualAddress,
          location: shippingLocationWKT,
          addressDetails: addressDetails
        });

        const orderData = {
          user_id: session.user.id,
          total: sellerTotal,
          total_amount: sellerTotal,
          order_status: 'Order Placed',
          payment_method: 'cash_on_delivery',
          shipping_address: manualAddress,
          created_at: new Date().toISOString(),
          seller_id: sellerId,
          shipping_location: shippingLocationWKT,
        };

        const { data: order, error: orderError } = await retryRequest(() =>
          supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single()
        );

        if (orderError) {
          console.error('Order insertion error:', orderError);
          throw new Error(`Order creation failed: ${orderError.message}`);
        }

        const orderItems = sellerProducts.map((product) => {
          const cartItem = cartItems.find((item) => item.id === product.cartId);
          return {
            order_id: order.id,
            product_id: product.id,
            quantity: cartItem?.quantity || 1,
            price: product.selectedVariant?.price || product.price || 0,
            variant_id: product.selectedVariant?.id || null,
          };
        });

        const { error: itemsError } = await retryRequest(() =>
          supabase.from('order_items').insert(orderItems)
        );

        if (itemsError) {
          console.error('Order items error:', itemsError);
          throw new Error(`Failed to save order items: ${itemsError.message}`);
        }
      }

      const { error: clearCartError } = await retryRequest(() =>
        supabase.from('cart').delete().eq('user_id', session.user.id)
      );

      if (clearCartError) {
        console.warn('Cart clearing error:', clearCartError);
      }

      toast.success('🎉 Order placed successfully! Thank you for shopping with Markeet.', {
        duration: 5000,
        style: { background: '#10b981', color: '#fff' }
      });

      localStorage.setItem('cart', JSON.stringify([]));
      setCartItems([]);
      navigate('/account');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(`Failed to place order: ${error.message}`, {
        duration: 5000,
        style: { background: '#ff4d4f', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total
  const total = products.reduce((sum, product) => {
    const cartItem = cartItems.find((item) => item.id === product.cartId);
    const price = product.selectedVariant?.price || product.price || 0;
    const qty = cartItem?.quantity || 1;
    return sum + (Number.isFinite(price) ? price * qty : 0);
  }, 0);

  if (fetchLoading && products.length === 0) {
    return (
      <div className="loading-container" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>🔄 Loading your checkout...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-cart-container">
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some amazing products to your cart to proceed with checkout.</p>
        <button
          onClick={() => navigate('/')}
          className="continue-shopping-btn"
          aria-label="Continue shopping"
        >
          🛍️ Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container fade-in">
      <Helmet>
        <title>Checkout - Markeet</title>
        <meta name="description" content="Complete your purchase securely with Cash on Delivery" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="checkout-header slide-up">
        <h1>🛒 Secure Checkout</h1>
        <p>Complete your purchase with Cash on Delivery</p>
      </div>

      {showLocationPrompt && (
        <div className="location-prompt" role="alert" aria-live="assertive">
          <h3>📍 Location Access Required</h3>
          <p>
            We need your location to verify delivery availability.{' '}
            {locationPermission === 'denied'
              ? 'Location access is denied. Please enable it in browser settings or enter your address manually.'
              : 'Please allow location access or enter your address manually.'}
          </p>
          <div className="location-buttons">
            <button
              ref={detectLocationButtonRef}
              onClick={handleDetectLocation}
              className="detect-location-btn prompt-btn"
              disabled={loading}
              aria-label="Detect location"
            >
              {loading ? (
                <>
                  <span className="spinner small"></span> Detecting...
                </>
              ) : (
                '📍 Detect My Location'
              )}
            </button>
            <button
              onClick={() => setShowLocationPrompt(false)}
              className="dismiss-prompt-btn"
              aria-label="Dismiss prompt"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="cart-items-section">
        <h2 className="cart-items-title">Items in Cart</h2>
        {invalidProducts.length > 0 && (
          <div className="invalid-products-warning" role="alert">
            <p>
              Unavailable products: {invalidProducts.join(', ')}.{' '}
              <button
                onClick={handleRemoveInvalidProducts}
                className="remove-invalid-btn"
                aria-label="Remove unavailable products"
              >
                Remove Unavailable Items
              </button>
            </p>
          </div>
        )}
        <div className="cart-items-list">
          {products.map((p) => {
            const cartItem = cartItems.find((item) => item.id === p.cartId);
            const qty = cartItem?.quantity || 1;
            const price = p.selectedVariant?.price || p.price || 0;
            const attrs = p.selectedVariant?.attributes
              ? Object.entries(p.selectedVariant.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')
              : null;
            const distance = userLocation
              ? calculateDistance(userLocation, {
                  latitude: p.latitude,
                  longitude: p.longitude,
                  delivery_radius_km: p.delivery_radius_km,
                })?.toFixed(2) || 'N/A'
              : 'N/A';
            const inRange =
              userLocation && p.latitude && p.longitude && p.delivery_radius_km
                ? calculateDistance(userLocation, {
                    latitude: p.latitude,
                    longitude: p.longitude,
                    delivery_radius_km: p.delivery_radius_km,
                  }) <= p.delivery_radius_km
                : false;

            return (
              <div key={p.uniqueKey} className="checkout-item">
                <img
                  src={p.images?.[0] || DEFAULT_IMAGE}
                  alt={p.title || 'Unnamed Product'}
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                  className="checkout-item-image"
                  loading="lazy"
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
                  <p>
                    Subtotal: ₹{(price * qty).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p>
                    Distance to Seller: {distance} km{' '}
                    {p.delivery_radius_km && (
                      <span className={inRange ? 'in-range' : 'out-of-range'}>
                        ({inRange ? 'In Range' : `Out of Range (Max ${p.delivery_radius_km} km)`})
                      </span>
                    )}
                    {!p.latitude || !p.longitude || !p.delivery_radius_km ? (
                      <span className="out-of-range"> (Location data missing)</span>
                    ) : null}
                  </p>
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

        <h3 className="checkout-section-title">📍 Delivery Address</h3>
        {addressDetails && (
          <div className="address-details-box" role="region" aria-label="Verified delivery address details">
            <p className="detected-address-label">Verified Address Details:</p>
            <p className="detected-address">{addressDetails.formattedAddress}</p>
            <div className="address-components">
              {addressDetails.components.addressNumber && (
                <p><strong>House/Flat:</strong> {addressDetails.components.addressNumber}</p>
              )}
              {addressDetails.components.street && (
                <p><strong>Street:</strong> {addressDetails.components.street}</p>
              )}
              {addressDetails.components.place && (
                <p><strong>City:</strong> {addressDetails.components.place}</p>
              )}
              {addressDetails.components.postcode && (
                <p><strong>Pincode:</strong> {addressDetails.components.postcode}</p>
              )}
              {addressDetails.components.district && (
                <p><strong>District:</strong> {addressDetails.components.district}</p>
              )}
              {addressDetails.components.region && (
                <p><strong>State:</strong> {addressDetails.components.region}</p>
              )}
              <p><strong>Country:</strong> India</p>
              {addressDetails.lat && addressDetails.lon && (
                <p><strong>Coordinates:</strong> ({addressDetails.lat.toFixed(6)}, {addressDetails.lon.toFixed(6)})</p>
              )}
              {addressDetails.accuracy && (
                <p><strong>Geocoding Accuracy:</strong> {addressDetails.accuracy}</p>
              )}
              {addressDetails.geolocationAccuracy && (
                <p><strong>Location Accuracy:</strong> {addressDetails.geolocationAccuracy.toFixed(0)} meters</p>
              )}
            </div>
          </div>
        )}
        {!addressDetails && address && (
          <div className="detected-address-box">
            <p className="detected-address-label">Detected Address:</p>
            <p className="detected-address">{address}</p>
          </div>
        )}

        <label htmlFor="shipping-address" className="address-label">
          Complete Delivery Address <span className="required-asterisk">*</span>
        </label>
        <p className="address-hint">
          Include: House/Flat No., Street, Area/Locality, City, State, Pincode
        </p>
        <textarea
          id="shipping-address"
          value={manualAddress}
          onChange={(e) => handleManualAddressChange(e.target.value)}
          placeholder="Example: Flat 301, Building A, Green Valley Apartments, Sector 5, Salt Lake, Kolkata, West Bengal, 700091, India"
          rows="5"
          className="address-textarea"
          aria-label="Enter complete shipping address"
          aria-describedby="address-error address-hint"
          aria-invalid={!!addressError}
          aria-required="true"
        />
        {addressError && (
          <p id="address-error" className="address-error" role="alert">
            ⚠️ {addressError}
          </p>
        )}
        {isGeocodingAddress && (
          <p className="geocoding-status">
            <span className="spinner small"></span> Verifying address and fetching coordinates...
          </p>
        )}

        <div className="location-input-section">
          <button
            onClick={handleDetectLocation}
            className="detect-location-btn"
            disabled={loading || isGeocodingAddress}
            aria-label="Detect my current location"
          >
            {loading ? (
              <>
                <span className="spinner small"></span> Detecting...
              </>
            ) : (
              '📍 Auto-Detect My Location'
            )}
          </button>

          {userLocation && userLocation.lat && userLocation.lon && (
            <div className="location-info">
              <p className="location-verified">
                ✓ Location verified • Coordinates: ({userLocation.lat.toFixed(6)}, {userLocation.lon.toFixed(6)})
              </p>
            </div>
          )}
        </div>

        <h3 className="checkout-section-title">💵 Payment Method</h3>
        <div className="payment-method-box">
          <p className="payment-method">Cash on Delivery (COD)</p>
          <p className="payment-method-desc">Pay with cash when your order is delivered</p>
        </div>

        <div className="checkout-action">
          <div className="place-order-wrapper" data-tooltip={getDisabledReason()}>
            <button
              onClick={handleCheckout}
              className={`place-order-btn ${!getDisabledReason() ? 'enabled' : ''}`}
              disabled={!!getDisabledReason()}
              aria-label="Place order with Cash on Delivery"
              aria-busy={loading}
              aria-describedby="place-order-error"
            >
              {loading ? (
                <>
                  <span className="spinner small"></span> Processing Order...
                </>
              ) : (
                '💵 Place Order (Cash on Delivery)'
              )}
            </button>
            {getDisabledReason() && (
              <p id="place-order-error" className="place-order-error" role="alert">
                {getDisabledReason()}
              </p>
            )}
          </div>
        </div>

        <div className="checkout-footer-info">
          <p>🔒 Your personal information is secure</p>
          <p>📦 Orders typically arrive within 3-5 business days</p>
          <p>📍 Delivery only available within seller's specified radius</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Checkout;
