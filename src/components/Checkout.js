// // import React, { useState, useEffect } from 'react';
// // import { supabase } from '../supabaseClient';
// // import { useNavigate } from 'react-router-dom';
// // import '../style/Checkout.css';

// // function Checkout() {
// //   const [cartItems, setCartItems] = useState([]);
// //   const [products, setProducts] = useState([]);
// //   const [location, setLocation] = useState(null); // Detected coordinates
// //   const [address, setAddress] = useState(''); // Detected or manual address
// //   const [manualAddress, setManualAddress] = useState(''); // Manual address input
// //   const [paymentMethod, setPaymentMethod] = useState('credit_card');
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [orderConfirmed, setOrderConfirmed] = useState(false);
// //   const navigate = useNavigate();

// //   useEffect(() => {
// //     // Fetch cart items from localStorage
// //     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
// //     setCartItems(storedCart);
// //     fetchCartProducts(storedCart);

// //     // Auto-detect user location
// //     if (navigator.geolocation) {
// //       navigator.geolocation.getCurrentPosition(
// //         async (position) => {
// //           const userLocation = {
// //             lat: position.coords.latitude,
// //             lon: position.coords.longitude,
// //           };
// //           setLocation(userLocation);
// //           console.log('Detected location (coordinates):', userLocation);
// //           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
// //           setAddress(detectedAddress || 'Address not found. Please enter manually.');
// //         },
// //         (geoError) => {
// //           console.error('Geolocation error:', geoError);
// //           setError('Unable to detect your location. Please enter your address manually.');
// //           setLocation(null);
// //           setAddress('');
// //         }
// //       );
// //     } else {
// //       setError('Geolocation is not supported by your browser. Please enter your address manually.');
// //       setLocation(null);
// //       setAddress('');
// //     }
// //   }, []);

// //   const fetchCartProducts = async (cart) => {
// //     setLoading(true);
// //     try {
// //       if (cart.length === 0) {
// //         setProducts([]);
// //         setLoading(false);
// //         return;
// //       }

// //       // Fetch product details from Supabase using product IDs from cart
// //       const productIds = cart.map(item => item.id);
// //       const { data, error } = await supabase
// //         .from('products')
// //         .select('id, name, price, images, seller_id')
// //         .in('id', productIds)
// //         .eq('is_approved', true);

// //       if (error) throw error;

// //       if (data) {
// //         console.log('Checkout products with images:', data);
// //         setProducts(data.map(product => ({
// //           ...product,
// //           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
// //         })));
// //       }
// //     } catch (error) {
// //       console.error('Error fetching checkout products:', error);
// //       setError(`Error: ${error.message}`);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const total = products.reduce((sum, product) => sum + (product.price || 0), 0);

// //   const reverseGeocode = async (lat, lon) => {
// //     try {
// //       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
// //       if (!response.ok) throw new Error('Reverse geocoding failed');
// //       const data = await response.json();
// //       if (data && data.display_name) {
// //         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
// //       }
// //       return null;
// //     } catch (error) {
// //       console.error('Error reverse geocoding:', error);
// //       return null;
// //     }
// //   };

// //   const handleManualAddressChange = (e) => {
// //     setManualAddress(e.target.value);
// //   };

// //   const handleCheckout = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     try {
// //       const { data: { session } } = await supabase.auth.getSession();
// //       if (!session) {
// //         setError('You must be logged in to place an order.');
// //         setLoading(false);
// //         return;
// //       }

// //       // Use detected coordinates if available, otherwise use a default
// //       const shippingLocation = location || {
// //         lat: 12.9753, // Default to Bengaluru
// //         lon: 77.591,
// //       };

// //       // Use detected address or manual address if provided
// //       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

// //       // Simulate payment processing (replace with real payment gateway in production)
// //       if (!simulatePayment()) {
// //         throw new Error('Payment failed. Please try again.');
// //       }

// //       // Save order to Supabase (store both coordinates and address)
// //       const orderItems = products.map(product => ({
// //         product_id: product.id,
// //         quantity: 1, // Assuming 1 item per product in cart (adjust if quantities are tracked)
// //         price_at_time: product.price,
// //       }));

// //       const { data: orderData, error: orderError } = await supabase
// //         .from('orders')
// //         .insert({
// //           user_id: session.user.id,
// //           seller_id: products[0]?.seller_id, // Assuming all products have the same seller (adjust if needed)
// //           total_amount: total,
// //           payment_method: paymentMethod,
// //           order_status: 'Pending',
// //           shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
// //           shipping_address: finalAddress,
// //           created_at: new Date().toISOString(),
// //           updated_at: new Date().toISOString(),
// //         })
// //         .select(); // Add .select() to return the inserted data

// //       if (orderError) throw orderError;

// //       // Insert order items
// //       const orderItemsPayload = orderItems.map(item => ({
// //         order_id: orderData[0].id, // Use the ID from the inserted order
// //         ...item,
// //       }));

// //       const { error: itemsError } = await supabase
// //         .from('order_items')
// //         .insert(orderItemsPayload);

// //       if (itemsError) throw itemsError;

// //       // Clear cart
// //       setCartItems([]);
// //       setProducts([]);
// //       localStorage.setItem('cart', JSON.stringify([]));
// //       setOrderConfirmed(true);
// //       setError(null);

// //       // Redirect to the "My Orders" section of the Account page immediately
// //       navigate('/account');
// //     } catch (error) {
// //       console.error('Error during checkout:', error);
// //       setError(`Error: ${error.message}`);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const simulatePayment = () => {
// //     // Simulate payment processing (replace with real payment gateway like Stripe)
// //     return Math.random() > 0.1; // 90% success rate for simulation
// //   };

// //   if (loading) return <div className="checkout-loading">Processing...</div>;
// //   if (error) return <div className="checkout-error">{error}</div>;
// //   if (orderConfirmed) return (
// //     <div className="checkout-success">
// //       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
// //       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
// //     </div>
// //   );

// //   return (
// //     <div className="checkout">
// //       <h1 style={{ color: '#007bff' }}>Checkout</h1>
// //       {cartItems.length === 0 ? (
// //         <p style={{ color: '#666' }}>Your cart is empty</p>
// //       ) : (
// //         <>
// //           <div className="checkout-items">
// //             {products.map((product) => (
// //               <div key={product.id} className="checkout-item">
// //                 <img 
// //                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
// //                   alt={product.name} 
// //                   onError={(e) => { 
// //                     e.target.src = 'https://dummyimage.com/150'; 
// //                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
// //                   }}
// //                   className="checkout-item-image"
// //                 />
// //                 <div className="checkout-item-details">
// //                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
// //                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //           <div className="checkout-details">
// //             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
// //             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

// //             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
// //             {location && address ? (
// //               <p style={{ color: '#666' }}>
// //                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
// //               </p>
// //             ) : (
// //               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
// //             )}
// //             <textarea
// //               value={manualAddress}
// //               onChange={handleManualAddressChange}
// //               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
// //               className="address-input"
// //               rows="3"
// //             />

// //             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
// //             <select
// //               value={paymentMethod}
// //               onChange={(e) => setPaymentMethod(e.target.value)}
// //               className="payment-select"
// //             >
// //               <option value="credit_card">Credit Card</option>
// //               <option value="debit_card">Debit Card</option>
// //               <option value="upi">UPI</option>
// //               <option value="cash_on_delivery">Cash on Delivery</option>
// //             </select>

// //             <button onClick={handleCheckout} className="checkout-btn" disabled={loading}>
// //               {loading ? 'Processing...' : 'Place Order'}
// //             </button>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }

// // export default Checkout;


// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null); // Detected coordinates
//   const [address, setAddress] = useState(''); // Detected or manual address
//   const [manualAddress, setManualAddress] = useState(''); // Manual address input
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     // Auto-detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Unable to detect your location. Please enter your address manually.');
//           setLocation(null);
//           setAddress('');
//         }
//       );
//     } else {
//       setError('Geolocation is not supported by your browser. Please enter your address manually.');
//       setLocation(null);
//       setAddress('');
//     }
//   }, []);

//   const fetchCartProducts = async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch product details from Supabase using product IDs from cart
//       const productIds = cart.map(item => item.id);
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, name, price, images, seller_id')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (data) {
//         console.log('Checkout products with images:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const total = products.reduce((sum, product) => sum + (product.price || 0), 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setError('You must be logged in to place an order.');
//         setLoading(false);
//         return;
//       }

//       // Use detected coordinates if available, otherwise use a default
//       const shippingLocation = location || {
//         lat: 12.9753, // Default to Bengaluru
//         lon: 77.591,
//       };

//       // Use detected address or manual address if provided
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

//       // Simulate payment processing (replace with real payment gateway in production)
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Save order to Supabase (store both coordinates and address)
//       const orderItems = products.map(product => ({
//         product_id: product.id,
//         quantity: 1, // Assuming 1 item per product in cart (adjust if quantities are tracked)
//         price_at_time: product.price,
//       }));

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: products[0]?.seller_id, // Assuming all products have the same seller (adjust if needed)
//           total: total, // Updated from total_amount to total to match schema
//           payment_method: paymentMethod,
//           status: 'pending',
//           shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//           shipping_address: finalAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .select(); // Add .select() to return the inserted data

//       if (orderError) throw orderError;

//       // Insert order items
//       const orderItemsPayload = orderItems.map(item => ({
//         order_id: orderData[0].id, // Use the ID from the inserted order
//         ...item,
//       }));

//       const { error: itemsError } = await supabase
//         .from('order_items')
//         .insert(orderItemsPayload);

//       if (itemsError) throw itemsError;

//       // Clear cart
//       setCartItems([]);
//       setProducts([]);
//       localStorage.setItem('cart', JSON.stringify([]));
//       setOrderConfirmed(true);
//       setError(null);

//       // Redirect to the "My Orders" section of the Account page immediately
//       navigate('/account');
//     } catch (error) {
//       console.error('Error during checkout:', error);
//       if (error.code === 'PGRST204') {
//         setError('Database schema error. Please contact support or try again later.');
//       } else {
//         setError(`Error: ${error.message}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const simulatePayment = () => {
//     // Simulate payment processing (replace with real payment gateway in production)
//     return true; // Always succeed for testing
//     // For production, replace with: return Math.random() > 0.1; // 90% success rate for simulation
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item">
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   className="checkout-item-image"
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               className="address-input"
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className="payment-select"
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} className="checkout-btn" disabled={loading}>
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // export default Checkout;import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null); // Detected coordinates
//   const [address, setAddress] = useState(''); // Detected or manual address
//   const [manualAddress, setManualAddress] = useState(''); // Manual address input
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     // Auto-detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Unable to detect your location. Please enter your address manually.');
//           setLocation(null);
//           setAddress('');
//         }
//       );
//     } else {
//       setError('Geolocation is not supported by your browser. Please enter your address manually.');
//       setLocation(null);
//       setAddress('');
//     }
//   }, []);

//   const fetchCartProducts = async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch product details from Supabase using product IDs from cart
//       const productIds = cart.map(item => item.id);
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (data) {
//         console.log('Checkout products with images and prices:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const total = products.reduce((sum, product) => sum + (product.price * (cartItems.find(item => item.id === product.id)?.quantity || 1)), 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }

//       console.log('Current session user ID:', session.user.id);

//       const userId = session.user.id;
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', userId)
//         .single();

//       if (profileError) throw profileError;

//       if (profileData.is_seller) {
//         setError('Sellers cannot place orders as buyers. Please log in as a buyer, manage your products, or view your orders.');
//         setLoading(false);
//         navigate('/account'); // Redirect to account to manage seller functions
//         return;
//       }

//       // Use detected coordinates if available, otherwise use a default
//       const shippingLocation = location || {
//         lat: 12.9753, // Default to Bengaluru
//         lon: 77.591,
//       };

//       // Use detected address or manual address if provided
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

//       // Simulate payment processing (replace with real payment gateway in production)
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Save order to Supabase (store both coordinates and address)
//       const orderItems = cartItems.map(item => ({
//         product_id: item.id,
//         quantity: item.quantity || 1, // Use quantity from cart
//         price: products.find(p => p.id === item.id)?.price || 0.00, // Ensure price is never null
//       }));

//       let attempt = 0;
//       const maxAttempts = 3;

//       while (attempt < maxAttempts) {
//         try {
//           console.log('Checkout payload:', {
//             user_id: userId,
//             seller_id: products[0]?.seller_id, // From products, not the seller’s user_id
//             total_amount: total,
//             payment_method: paymentMethod,
//             order_status: 'pending',
//             shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           });

//           const { data: orderData, error: orderError } = await supabase
//             .from('orders')
//             .insert({
//               user_id: userId,
//               seller_id: products[0]?.seller_id, // Ensure seller_id is from the product, not the user
//               total_amount: total,
//               payment_method: paymentMethod,
//               order_status: 'pending',
//               shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//               shipping_address: finalAddress,
//               created_at: new Date().toISOString(),
//               updated_at: new Date().toISOString(),
//             })
//             .select();

//           if (orderError) {
//             if (orderError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation. Please ensure you have the correct permissions or contact support.');
//             } else if (orderError.code === 'PGRST204') {
//               throw new Error('Database schema error. Please contact support or try again later.');
//             } else if (orderError.code === '23502') {
//               throw new Error('Missing required field. Ensure all non-null fields (e.g., total_amount) are provided.');
//             }
//             throw orderError;
//           }

//           console.log('Inserted order ID:', orderData[0].id, 'with user_id:', userId);

//           // Wait briefly to ensure the order is available in the database
//           await new Promise(resolve => setTimeout(resolve, 500));

//           // Insert order items with debugging
//           const orderItemsPayload = orderItems.map(item => ({
//             order_id: orderData[0].id,
//             ...item,
//           }));

//           console.log('Order items payload:', orderItemsPayload);

//           const { error: itemsError } = await supabase
//             .from('order_items')
//             .insert(orderItemsPayload);

//           if (itemsError) {
//             if (itemsError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation for order items. Please ensure you have the correct permissions or contact support.');
//             }
//             throw itemsError;
//           }

//           // Clear cart
//           setCartItems([]);
//           setProducts([]);
//           localStorage.setItem('cart', JSON.stringify([]));
//           setOrderConfirmed(true);
//           setError(null);

//           // Redirect to the "My Orders" section of the Account page immediately
//           navigate('/account');
//           break;
//         } catch (error) {
//           console.error(`Attempt ${attempt + 1} - Error during checkout:`, error);
//           attempt++;
//           if (attempt === maxAttempts) {
//             setError(`Error: ${error.message || 'Failed to place order after multiple attempts. Please check your permissions, schema, or try again later.'}`);
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//         }
//       }
//     } catch (error) {
//       console.error('Final error during checkout:', error);
//       if (error.code === 'PGRST204') {
//         setError('Database schema error. Please contact support or try again later.');
//       } else if (error.code === '23502') {
//         setError('Missing required field. Please ensure all non-null fields are provided.');
//       } else {
//         setError(`Error: ${error.message}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const simulatePayment = () => {
//     // Simulate payment processing (replace with real payment gateway in production)
//     return true; // Always succeed for testing
//     // For production, replace with: return Math.random() > 0.1; // 90% success rate for simulation
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.title} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.title, 'URL:', product.images?.[0]); 
//                   }}
//                   style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.title}</h3>
//                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <p style={{ color: '#666' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default Checkout;


// import React, { useState, useEffect } from 'react'; // Ensure this import is present
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null); // Detected coordinates
//   const [address, setAddress] = useState(''); // Detected or manual address
//   const [manualAddress, setManualAddress] = useState(''); // Manual address input
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     // Auto-detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Unable to detect your location. Please enter your address manually.');
//           setLocation(null);
//           setAddress('');
//         }
//       );
//     } else {
//       setError('Geolocation is not supported by your browser. Please enter your address manually.');
//       setLocation(null);
//       setAddress('');
//     }
//   }, []);

//   const fetchCartProducts = async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch product details from Supabase using product IDs from cart
//       const productIds = cart.map(item => item.id);
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (data) {
//         console.log('Checkout products with images and prices:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const total = products.reduce((sum, product) => sum + (product.price * (cartItems.find(item => item.id === product.id)?.quantity || 1)), 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }

//       console.log('Current session user ID:', session.user.id);

//       const userId = session.user.id;
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', userId)
//         .single();

//       if (profileError) throw profileError;

//       if (profileData.is_seller) {
//         setError('Sellers cannot place orders as buyers. Please log in as a buyer, manage your products, or view your orders.');
//         setLoading(false);
//         navigate('/account'); // Redirect to account to manage seller functions
//         return;
//       }

//       // Use detected coordinates if available, otherwise use a default
//       const shippingLocation = location || {
//         lat: 12.9753, // Default to Bengaluru
//         lon: 77.591,
//       };

//       // Use detected address or manual address if provided
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

//       // Simulate payment processing (replace with real payment gateway in production)
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Save order to Supabase (store both coordinates and address)
//       const orderItems = cartItems.map(item => ({
//         product_id: item.id,
//         quantity: item.quantity || 1, // Use quantity from cart
//         price: products.find(p => p.id === item.id)?.price || 0.00, // Ensure price is never null
//       }));

//       let attempt = 0;
//       const maxAttempts = 3;

//       while (attempt < maxAttempts) {
//         try {
//           console.log('Checkout payload:', {
//             user_id: userId,
//             seller_id: products[0]?.seller_id, // From products, not the seller’s user_id
//             total_amount: total,
//             payment_method: paymentMethod,
//             order_status: 'pending',
//             shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//             shipping_address: finalAddress,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           });

//           const { data: orderData, error: orderError } = await supabase
//             .from('orders')
//             .insert({
//               user_id: userId,
//               seller_id: products[0]?.seller_id, // Ensure seller_id is from the product, not the user
//               total_amount: total,
//               payment_method: paymentMethod,
//               order_status: 'pending',
//               shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//               shipping_address: finalAddress,
//               created_at: new Date().toISOString(),
//               updated_at: new Date().toISOString(),
//             })
//             .select();

//           if (orderError) {
//             if (orderError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation. Please ensure you have the correct permissions or contact support.');
//             } else if (orderError.code === 'PGRST204') {
//               throw new Error('Database schema error. Please contact support or try again later.');
//             } else if (orderError.code === '23502') {
//               throw new Error('Missing required field. Ensure all non-null fields (e.g., total_amount) are provided.');
//             }
//             throw orderError;
//           }

//           console.log('Inserted order ID:', orderData[0].id, 'with user_id:', userId);

//           // Wait briefly to ensure the order is available in the database
//           await new Promise(resolve => setTimeout(resolve, 500));

//           // Insert order items with debugging
//           const orderItemsPayload = orderItems.map(item => ({
//             order_id: orderData[0].id,
//             ...item,
//           }));

//           console.log('Order items payload:', orderItemsPayload);

//           const { error: itemsError } = await supabase
//             .from('order_items')
//             .insert(orderItemsPayload);

//           if (itemsError) {
//             if (itemsError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation for order items. Please ensure you have the correct permissions or contact support.');
//             }
//             throw itemsError;
//           }

//           // Clear cart
//           setCartItems([]);
//           setProducts([]);
//           localStorage.setItem('cart', JSON.stringify([]));
//           setOrderConfirmed(true);
//           setError(null);

//           // Redirect to the "My Orders" section of the Account page immediately
//           navigate('/account');
//           break;
//         } catch (error) {
//           console.error(`Attempt ${attempt + 1} - Error during checkout:`, error);
//           attempt++;
//           if (attempt === maxAttempts) {
//             setError(`Error: ${error.message || 'Failed to place order after multiple attempts. Please check your permissions, schema, or try again later.'}`);
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//         }
//       }
//     } catch (error) {
//       console.error('Final error during checkout:', error);
//       if (error.code === 'PGRST204') {
//         setError('Database schema error. Please contact support or try again later.');
//       } else if (error.code === '23502') {
//         setError('Missing required field. Please ensure all non-null fields are provided.');
//       } else {
//         setError(`Error: ${error.message}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const simulatePayment = () => {
//     // Simulate payment processing (replace with real payment gateway in production)
//     return true; // Always succeed for testing
//     // For production, replace with: return Math.random() > 0.1; // 90% success rate for simulation
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.title} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.title, 'URL:', product.images?.[0]); 
//                   }}
//                   style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.title}</h3>
//                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <p style={{ color: '#666' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default Checkout;

// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null); // Detected coordinates
//   const [address, setAddress] = useState(''); // Detected or manual address
//   const [manualAddress, setManualAddress] = useState(''); // Manual address input
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     // Auto-detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           setError('Unable to detect your location. Please enter your address manually.');
//           setLocation(null);
//           setAddress('');
//         }
//       );
//     } else {
//       setError('Geolocation is not supported by your browser. Please enter your address manually.');
//       setLocation(null);
//       setAddress('');
//     }
//   }, []);

//   const fetchCartProducts = async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch product details from Supabase using product IDs from cart
//       const productIds = cart.map(item => item.id);
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, price, images, seller_id')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (data) {
//         console.log('Checkout products with images and prices:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const total = products.reduce((sum, product) => sum + (product.price * (cartItems.find(item => item.id === product.id)?.quantity || 1)), 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
//         headers: {
//           'User-Agent': 'FreshCart/1.0 (contact@example.com)', // Add user agent for Nominatim compliance
//         },
//       });
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }

//       console.log('Current session user ID:', session.user.id);

//       const userId = session.user.id;
//       const { data: profileData, error: profileError } = await supabase
//         .from('profiles')
//         .select('is_seller')
//         .eq('id', userId)
//         .single();

//       if (profileError) throw profileError;

//       if (profileData.is_seller) {
//         setError('Sellers cannot place orders as buyers. Please log in as a buyer, manage your products, or view your orders.');
//         setLoading(false);
//         navigate('/account'); // Redirect to account to manage seller functions
//         return;
//       }

//       // Use detected coordinates if available, otherwise use a default
//       const shippingLocation = location || {
//         lat: 12.9753, // Default to Bengaluru
//         lon: 77.591,
//       };

//       // Use detected address or manual address if provided
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

//       // Simulate payment processing (replace with real payment gateway in production)
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Save order to Supabase (store both coordinates and address)
//       const orderItems = cartItems.map(item => ({
//         product_id: item.id,
//         quantity: item.quantity || 1, // Use quantity from cart
//         price: products.find(p => p.id === item.id)?.price || 0.00, // Ensure price is never null
//       }));

//       let attempt = 0;
//       const maxAttempts = 3;

//       while (attempt < maxAttempts) {
//         try {
//           // Validate payload before sending
//           if (!userId || !products[0]?.seller_id || total === 0 || !paymentMethod || !finalAddress) {
//             throw new Error('Missing required fields. Ensure all order details are provided.');
//           }

//           console.log('Checkout payload:', {
//             user_id: userId,
//             seller_id: products[0]?.seller_id, // Optional, nullable in schema
//             total: total, // Use 'total' instead of 'total_amount' based on schema
//             order_status: 'pending',
//             payment_method: paymentMethod,
//             shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`, // Optional, nullable
//             shipping_address: finalAddress, // Optional, nullable
//             created_at: new Date().toISOString(), // Optional, nullable
//             updated_at: new Date().toISOString(), // Optional, nullable
//           });

//           const { data: orderData, error: orderError } = await supabase
//             .from('orders')
//             .insert({
//               user_id: userId,
//               seller_id: products[0]?.seller_id, // Optional, nullable in schema
//               total: total, // Use 'total' instead of 'total_amount' based on schema
//               order_status: 'pending',
//               payment_method: paymentMethod,
//               shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`, // Optional, nullable
//               shipping_address: finalAddress, // Optional, nullable
//               created_at: new Date().toISOString(), // Optional, nullable
//               updated_at: new Date().toISOString(), // Optional, nullable
//             })
//             .select();

//           if (orderError) {
//             if (orderError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation. Please ensure you have the correct permissions or contact support.');
//             } else if (orderError.code === 'PGRST204') {
//               throw new Error('Database schema error. Please contact support or try again later.');
//             } else if (orderError.code === '23502') {
//               throw new Error(`Missing required field. Ensure all non-null fields (e.g., total, user_id) are provided. Details: ${orderError.message}`);
//             } else if (orderError.message.includes('foreign key violation')) {
//               throw new Error(`Foreign key violation. Ensure user_id and seller_id reference valid profiles/sellers. Details: ${orderError.message}`);
//             }
//             throw orderError;
//           }

//           console.log('Inserted order ID:', orderData[0].id, 'with user_id:', userId);

//           // Wait briefly to ensure the order is available in the database
//           await new Promise(resolve => setTimeout(resolve, 500));

//           // Insert order items with debugging
//           const orderItemsPayload = orderItems.map(item => ({
//             order_id: orderData[0].id,
//             ...item,
//           }));

//           console.log('Order items payload:', orderItemsPayload);

//           const { error: itemsError } = await supabase
//             .from('order_items')
//             .insert(orderItemsPayload);

//           if (itemsError) {
//             if (itemsError.code === '42501') {
//               throw new Error('Permission denied. Row-level security policy violation for order items. Please ensure you have the correct permissions or contact support.');
//             }
//             throw itemsError;
//           }

//           // Clear cart
//           setCartItems([]);
//           setProducts([]);
//           localStorage.setItem('cart', JSON.stringify([]));
//           setOrderConfirmed(true);
//           setError(null);

//           // Redirect to the "My Orders" section of the Account page immediately
//           navigate('/account');
//           break;
//         } catch (error) {
//           console.error(`Attempt ${attempt + 1} - Error during checkout:`, error);
//           attempt++;
//           if (attempt === maxAttempts) {
//             setError(`Error: ${error.message || 'Failed to place order after multiple attempts. Please check your permissions, schema, or try again later.'}`);
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
//         }
//       }
//     } catch (error) {
//       console.error('Final error during checkout:', error);
//       if (error.code === 'PGRST204') {
//         setError('Database schema error. Please contact support or try again later.');
//       } else if (error.code === '23502') {
//         setError('Missing required field. Please ensure all non-null fields (e.g., total, user_id) are provided.');
//       } else {
//         setError(`Error: ${error.message}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const simulatePayment = () => {
//     // Simulate payment processing (replace with real payment gateway in production)
//     return true; // Always succeed for testing
//     // For production, replace with: return Math.random() > 0.1; // 90% success rate for simulation
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.title} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.title, 'URL:', product.images?.[0]); 
//                   }}
//                   style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.title}</h3>
//                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <p style={{ color: '#666' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
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

// export default Checkout;


// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// // Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function Checkout() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null); // Detected coordinates
//   const [address, setAddress] = useState(''); // Detected or manual address
//   const [manualAddress, setManualAddress] = useState(''); // Manual address input
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     // Auto-detect user location with increased timeout
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           if (geoError.code === 1) {
//             console.error('Geolocation permission denied:', geoError);
//             setError('Location access denied. Please enable location services or enter your address manually.');
//             setLocation({ lat: 12.9753, lon: 77.591 }); // Default to Bengaluru
//             setAddress('Bangalore, Karnataka, India');
//           } else if (geoError.code === 3) {
//             console.error('Geolocation timeout:', geoError);
//             setError('Geolocation timed out. Using default Bengaluru location.');
//             setLocation({ lat: 12.9753, lon: 77.591 }); // Default to Bengaluru
//             setAddress('Bangalore, Karnataka, India');
//           } else {
//             console.error('Geolocation error:', geoError);
//             setError('Unable to detect your location. Using default Bengaluru location.');
//             setLocation({ lat: 12.9753, lon: 77.591 }); // Default to Bengaluru
//             setAddress('Bangalore, Karnataka, India');
//           }
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 } // Increased timeout to 10 seconds
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 }); // Default to Bengaluru
//       setAddress('Bangalore, Karnataka, India');
//     }
//   }, []);

//   const fetchCartProducts = useCallback(async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = cart.map(item => item.id).filter(id => id); // Filter out null/undefined IDs
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, title, name, images, product_variants!product_variants_product_id_fkey(price, images)')
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );

//       if (error) {
//         if (error.code === '42703') {
//           console.error('Schema error: column "product_variants" not found. Check foreign key and schema cache.', error);
//           setError('Error fetching checkout products: Schema issue. Contact support.');
//         } else throw error;
//       }

//       if (data) {
//         console.log('Checkout products with images and prices:', data);
//         const validProducts = (data || [])
//           .filter(product => product.id && (product.title || product.name))
//           .map(product => ({
//             id: product.id,
//             name: product.title || product.name || 'Unnamed Product',
//             images: Array.isArray(product.images) ? product.images : (Array.isArray(product.product_variants?.[0]?.images) ? product.product_variants[0].images : ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg']),
//             price: product.product_variants?.[0]?.price || 0,
//           }));
//         setProducts(validProducts);
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
//         headers: {
//           'User-Agent': 'FreshCart/1.0 (contact@example.com)', // Add user agent for Nominatim compliance
//         },
//       });
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name; // e.g., "123 Main St, Bangalore, Karnataka, India"
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }

//       // Use detected coordinates if available, otherwise use a default
//       const shippingLocation = location || {
//         lat: 12.9753, // Default to Bengaluru
//         lon: 77.591,
//       };

//       // Use detected address or manual address if provided
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India'; // Fallback

//       // Simulate payment processing (replace with real payment gateway in production)
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Save order to Supabase
//       const orderItems = cartItems.map(item => ({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: products.find(p => p.id === item.id)?.price || 0,
//       }));

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: products[0]?.seller_id, // Optional, nullable in schema
//           total: total,
//           order_status: 'pending',
//           payment_method: paymentMethod,
//           shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`, // Optional, nullable
//           shipping_address: finalAddress, // Optional, nullable
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .select();

//       if (orderError) throw orderError;

//       const { error: itemsError } = await supabase
//         .from('order_items')
//         .insert(orderItems.map(item => ({
//           order_id: orderData[0].id,
//           ...item,
//         })));

//       if (itemsError) throw itemsError;

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

//   const simulatePayment = () => {
//     // Simulate payment processing (replace with real payment gateway in production)
//     return true; // Always succeed for testing
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#000', margin: '5px 0' }}>
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
//                   </p>
//                   <p style={{ color: '#666', margin: '5px 0' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button onClick={handleCheckout} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }} disabled={loading}>
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
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

// export default Checkout;



// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link, useNavigate } from 'react-router-dom';
// import '../style/Checkout.css';

// // Custom retry function for Supabase requests
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise(resolve => setTimeout(resolve, delay));
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

//   useEffect(() => {
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           console.log('Detected location (coordinates):', userLocation);
//           const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
//           setAddress(detectedAddress || 'Address not found. Please enter manually.');
//         },
//         (geoError) => {
//           if (geoError.code === 1) {
//             console.error('Geolocation permission denied:', geoError);
//             setError('Location access denied. Please enable location services or enter your address manually.');
//             setLocation({ lat: 12.9753, lon: 77.591 });
//             setAddress('Bangalore, Karnataka, India');
//           } else if (geoError.code === 3) {
//             console.error('Geolocation timeout:', geoError);
//             setError('Geolocation timed out. Using default Bengaluru location.');
//             setLocation({ lat: 12.9753, lon: 77.591 });
//             setAddress('Bangalore, Karnataka, India');
//           } else {
//             console.error('Geolocation error:', geoError);
//             setError('Unable to detect your location. Using default Bengaluru location.');
//             setLocation({ lat: 12.9753, lon: 77.591 });
//             setAddress('Bangalore, Karnataka, India');
//           }
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setError('Geolocation not supported. Using default Bengaluru location.');
//       setLocation({ lat: 12.9753, lon: 77.591 });
//       setAddress('Bangalore, Karnataka, India');
//     }
//   }, []);

//   // UPDATED: Now fetch 'seller_id' from products
//   const fetchCartProducts = useCallback(async (cart) => {
//     setLoading(true);
//     try {
//       if (cart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = cart.map(item => item.id).filter(id => id);
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
//             images,
//             product_variants!product_variants_product_id_fkey(price, images)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );

//       if (error) {
//         if (error.code === '42703') {
//           console.error('Schema error: column "product_variants" not found. Check foreign key and schema cache.', error);
//           setError('Error fetching checkout products: Schema issue. Contact support.');
//         } else throw error;
//       }

//       if (data) {
//         console.log('Checkout products with images and prices:', data);
//         const validProducts = data
//           .filter(product => product.id && (product.title || product.name))
//           .map(product => ({
//             id: product.id,
//             seller_id: product.seller_id, // store the seller_id
//             name: product.title || product.name || 'Unnamed Product',
//             images: Array.isArray(product.images)
//               ? product.images
//               : (
//                   Array.isArray(product.product_variants?.[0]?.images)
//                   ? product.product_variants[0].images
//                   : ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg']
//                 ),
//             price: product.product_variants?.[0]?.price || 0,
//           }));
//         setProducts(validProducts);
//       }
//     } catch (error) {
//       console.error('Error fetching checkout products:', error);
//       setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   const reverseGeocode = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
//         {
//           headers: {
//             'User-Agent': 'FreshCart/1.0 (contact@example.com)',
//           },
//         }
//       );
//       if (!response.ok) throw new Error('Reverse geocoding failed');
//       const data = await response.json();
//       if (data && data.display_name) {
//         return data.display_name;
//       }
//       return null;
//     } catch (error) {
//       console.error('Error reverse geocoding:', error);
//       return null;
//     }
//   };

//   const handleManualAddressChange = (e) => {
//     setManualAddress(e.target.value);
//   };

//   const handleCheckout = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         navigate('/auth');
//         setLoading(false);
//         return;
//       }

//       const shippingLocation = location || { lat: 12.9753, lon: 77.591 };
//       const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

//       // Simulate payment
//       if (!simulatePayment()) {
//         throw new Error('Payment failed. Please try again.');
//       }

//       // Gather the order items
//       const orderItems = cartItems.map(item => ({
//         product_id: item.id,
//         quantity: item.quantity || 1,
//         price: products.find(p => p.id === item.id)?.price || 0,
//       }));

//       // UPDATED: If all items are from a single seller, pick that ID
//       // If multiple sellers, you'd need a different approach
//       const singleSellerId = products[0]?.seller_id || null;

//       const { data: orderData, error: orderError } = await supabase
//         .from('orders')
//         .insert({
//           user_id: session.user.id,
//           seller_id: singleSellerId, // set the seller_id from the first product
//           total: total,
//           order_status: 'pending',
//           payment_method: paymentMethod,
//           shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
//           shipping_address: finalAddress,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .select();

//       if (orderError) throw orderError;

//       const { error: itemsError } = await supabase
//         .from('order_items')
//         .insert(orderItems.map(item => ({
//           order_id: orderData[0].id,
//           ...item,
//         })));

//       if (itemsError) throw itemsError;

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

//   const simulatePayment = () => {
//     // For testing only; always succeed
//     return true;
//   };

//   if (loading) return <div className="checkout-loading">Processing...</div>;
//   if (error) return <div className="checkout-error">{error}</div>;
//   if (orderConfirmed) return (
//     <div className="checkout-success">
//       <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
//       <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
//     </div>
//   );

//   return (
//     <div className="checkout">
//       <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="checkout-items">
//             {products.map((product) => (
//               <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//                 />
//                 <div className="checkout-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#000', margin: '5px 0' }}>
//                     ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
//                   </p>
//                   <p style={{ color: '#666', margin: '5px 0' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="checkout-details">
//             <h2 style={{ color: '#007bff' }}>Order Summary</h2>
//             <p style={{ color: '#666' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</p>

//             <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
//             {location && address ? (
//               <p style={{ color: '#666' }}>
//                 Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
//               </p>
//             ) : (
//               <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
//             )}
//             <textarea
//               value={manualAddress}
//               onChange={handleManualAddressChange}
//               placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
//               style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
//               rows="3"
//             />

//             <h3 style={{ color: '#007bff' }}>Payment Method</h3>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
//             >
//               <option value="credit_card">Credit Card</option>
//               <option value="debit_card">Debit Card</option>
//               <option value="upi">UPI</option>
//               <option value="cash_on_delivery">Cash on Delivery</option>
//             </select>

//             <button
//               onClick={handleCheckout}
//               style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
//               disabled={loading}
//             >
//               {loading ? 'Processing...' : 'Place Order'}
//             </button>
//           </div>
//         </>
//       )}
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

// export default Checkout;



import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Checkout.css';

// Custom retry function for Supabase requests
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
    fetchCartProducts(storedCart);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          console.log('Detected location (coordinates):', userLocation);
          const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
          setAddress(detectedAddress || 'Address not found. Please enter manually.');
        },
        (geoError) => {
          if (geoError.code === 1) {
            console.error('Geolocation permission denied:', geoError);
            setError('Location access denied. Please enable location services or enter your address manually.');
            setLocation({ lat: 12.9753, lon: 77.591 });
            setAddress('Bangalore, Karnataka, India');
          } else if (geoError.code === 3) {
            console.error('Geolocation timeout:', geoError);
            setError('Geolocation timed out. Using default Bengaluru location.');
            setLocation({ lat: 12.9753, lon: 77.591 });
            setAddress('Bangalore, Karnataka, India');
          } else {
            console.error('Geolocation error:', geoError);
            setError('Unable to detect your location. Using default Bengaluru location.');
            setLocation({ lat: 12.9753, lon: 77.591 });
            setAddress('Bangalore, Karnataka, India');
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation not supported. Using default Bengaluru location.');
      setLocation({ lat: 12.9753, lon: 77.591 });
      setAddress('Bangalore, Karnataka, India');
    }
  }, []);

  // Fetch cart products with price from products table
  const fetchCartProducts = useCallback(async (cart) => {
    setLoading(true);
    try {
      if (cart.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = cart.map(item => item.id).filter(id => id);
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await retryRequest(() =>
        supabase
          .from('products')
          .select(`
            id,
            seller_id,
            title,
            name,
            price,
            images,
            product_variants!product_variants_product_id_fkey(price, images)
          `)
          .in('id', productIds)
          .eq('is_approved', true)
      );

      if (error) {
        if (error.code === '42703') {
          console.error('Schema error: column issue detected. Check foreign key and schema cache.', error);
          setError('Error fetching checkout products: Schema issue. Contact support.');
        } else throw error;
      }

      if (data) {
        console.log('Checkout products with images and prices:', data);
        const validProducts = data
          .filter(product => product.id && (product.title || product.name))
          .map(product => {
            // Find the first variant with images
            const variantWithImages = product.product_variants?.find(
              (variant) => Array.isArray(variant.images) && variant.images.length > 0
            );

            // Decide which images to use
            const finalImages = (Array.isArray(product.images) && product.images.length > 0)
              ? product.images
              : (variantWithImages
                  ? variantWithImages.images
                  : ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg']);

            // Prioritize product.price, then variant price
            const productPrice = product.price !== null && product.price !== undefined ? product.price : null;
            const variantPrice = variantWithImages?.price ?? product.product_variants?.[0]?.price;
            const finalPrice = productPrice ?? variantPrice ?? 0;

            console.log(`Checkout Product ID ${product.id} (${product.title || product.name}):`, {
              productPrice,
              variantPrice,
              finalPrice,
              product_variants: product.product_variants,
            });

            return {
              id: product.id,
              seller_id: product.seller_id,
              name: product.title || product.name || 'Unnamed Product',
              images: finalImages,
              price: finalPrice,
            };
          });
        setProducts(validProducts);
      }
    } catch (error) {
      console.error('Error fetching checkout products:', error);
      setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const total = products.reduce((sum, product) => {
    const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
    return sum + (product.price || 0) * quantity;
  }, 0);

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FreshCart/1.0 (contact@example.com)',
          },
        }
      );
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  const handleManualAddressChange = (e) => {
    setManualAddress(e.target.value);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        navigate('/auth');
        setLoading(false);
        return;
      }

      const shippingLocation = location || { lat: 12.9753, lon: 77.591 };
      const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

      // Simulate payment
      if (!simulatePayment()) {
        throw new Error('Payment failed. Please try again.');
      }

      // Gather the order items
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity || 1,
        price: products.find(p => p.id === item.id)?.price || 0,
      }));

      const singleSellerId = products[0]?.seller_id || null;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          seller_id: singleSellerId,
          total: total,
          order_status: 'pending',
          payment_method: paymentMethod,
          shipping_location: `POINT(${shippingLocation.lon} ${shippingLocation.lat})`,
          shipping_address: finalAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems.map(item => ({
          order_id: orderData[0].id,
          ...item,
        })));

      if (itemsError) throw itemsError;

      // Clear cart
      setCartItems([]);
      setProducts([]);
      localStorage.setItem('cart', JSON.stringify([]));
      setOrderConfirmed(true);
      setError(null);

      navigate('/account');
    } catch (error) {
      console.error('Error during checkout:', error);
      setError(`Error: ${error.message || 'Failed to place order. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = () => {
    // For testing only; always succeed
    return true;
  };

  if (loading) return <div className="checkout-loading">Processing...</div>;
  if (error) return <div className="checkout-error">{error}</div>;
  if (orderConfirmed) return (
    <div className="checkout-success">
      <h1 style={{ color: '#007bff' }}>Order Confirmed!</h1>
      <p style={{ color: '#666' }}>Your order has been placed successfully. Redirecting to your account...</p>
    </div>
  );

  return (
    <div className="checkout">
      <h1 style={{ color: '#007bff' }}>FreshCart Checkout</h1>
      {cartItems.length === 0 ? (
        <p style={{ color: '#666' }}>Your cart is empty</p>
      ) : (
        <>
          <div className="checkout-items">
            {products.map((product) => (
              <div key={product.id} className="checkout-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
                <img 
                  src={product.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'} 
                  alt={product.name} 
                  onError={(e) => { 
                    e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'; 
                    console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
                  }}
                  style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
                />
                <div className="checkout-item-details">
                  <h3 style={{ color: '#007bff' }}>{product.name}</h3>
                  <p style={{ color: '#000', margin: '5px 0' }}>
                    ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ color: '#666', margin: '5px 0' }}>Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="checkout-details">
            <h2 style={{ color: '#007bff' }}>Order Summary</h2>
            <p style={{ color: '#666' }}>Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

            <h3 style={{ color: '#007bff' }}>Shipping Address</h3>
            {location && address ? (
              <p style={{ color: '#666' }}>
                Detected Address: {address} (Coordinates: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)})
              </p>
            ) : (
              <p style={{ color: '#666' }}>Address not detected. Please enter manually.</p>
            )}
            <textarea
              value={manualAddress}
              onChange={handleManualAddressChange}
              placeholder="Enter your shipping address (e.g., 123 Main St, Bangalore, Karnataka, India)"
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #007bff', marginBottom: '10px' }}
              rows="3"
            />

            <h3 style={{ color: '#007bff' }}>Payment Method</h3>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #007bff', backgroundColor: 'white', color: '#666' }}
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>

            <button
              onClick={handleCheckout}
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
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

export default Checkout;