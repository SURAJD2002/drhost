


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



import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Checkout.css';

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

  // ----------------------------------
  // Initial effect: load cart, fetch products, geolocation
  // ----------------------------------
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart);
    fetchCartProducts(storedCart);
    detectUserLocation();
  }, []);

  // ----------------------------------
  // Fetch products for the cart
  // ----------------------------------
  const fetchCartProducts = useCallback(async (cart) => {
    setLoading(true);
    try {
      if (cart.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = cart.map((item) => item.id).filter(Boolean);
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

      if (error) throw error;
      if (data) {
        const validProducts = data.map((product) => {
          // Find matching cart item
          const storedItem = cart.find((item) => item.id === product.id);
          if (storedItem && storedItem.selectedVariant) {
            // Use variant details from cart
            return {
              ...product,
              selectedVariant: storedItem.selectedVariant,
              price: storedItem.selectedVariant.price || product.price,
              images:
                storedItem.selectedVariant.images?.length
                  ? storedItem.selectedVariant.images
                  : product.images,
            };
          }
          // Fallback: use product's default or first variant
          const variantWithImages = product.product_variants?.find(
            (v) => Array.isArray(v.images) && v.images.length > 0
          );
          const finalImages =
            product.images?.length
              ? product.images
              : variantWithImages?.images || [
                  'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
                ];
          const productPrice =
            product.price !== null && product.price !== undefined
              ? product.price
              : variantWithImages?.price || 0;
          return {
            ...product,
            images: finalImages,
            price: productPrice,
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

  // ----------------------------------
  // Attempt geolocation
  // ----------------------------------
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(userLocation);
          const detectedAddress = await reverseGeocode(userLocation.lat, userLocation.lon);
          setAddress(detectedAddress || 'Address not found. Please enter manually.');
        },
        (geoError) => {
          console.error('Geolocation error:', geoError);
          setLocation({ lat: 12.9753, lon: 77.591 });
          setAddress('Bangalore, Karnataka, India');
          setError('Unable to fully detect location; using default Bengaluru location.');
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation not supported. Using default Bengaluru location.');
      setLocation({ lat: 12.9753, lon: 77.591 });
      setAddress('Bangalore, Karnataka, India');
    }
  };

  // ----------------------------------
  // Reverse geocode using OpenStreetMap
  // ----------------------------------
  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'FreshCart/1.0' } }
      );
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      if (data && data.display_name) return data.display_name;
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  // ----------------------------------
  // Compute total cost
  // ----------------------------------
  const total = products.reduce((sum, product) => {
    const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
    return sum + (product.price || 0) * quantity;
  }, 0);

  // ----------------------------------
  // Group cart items by seller
  // ----------------------------------
  function groupCartItemsBySeller() {
    const itemsBySeller = {};
    for (let item of cartItems) {
      const prod = products.find((p) => p.id === item.id);
      if (!prod) continue;
      const sid = prod.seller_id;
      if (!itemsBySeller[sid]) {
        itemsBySeller[sid] = [];
      }
      itemsBySeller[sid].push({
        product_id: item.id,
        quantity: item.quantity || 1,
        price: prod.price || 0,
      });
    }
    return itemsBySeller;
  }

  // ----------------------------------
  // Place Orders (one per seller)
  // ----------------------------------
  async function placeOrdersForAllSellers(sessionUserId, shippingLoc, finalAddress) {
    const itemsBySeller = groupCartItemsBySeller();

    // For each seller
    for (let sellerId of Object.keys(itemsBySeller)) {
      const sellerItems = itemsBySeller[sellerId];
      const subTotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: sessionUserId,
          seller_id: sellerId,
          total: subTotal,
          order_status: 'pending',
          payment_method: paymentMethod,
          shipping_location: `POINT(${shippingLoc.lon} ${shippingLoc.lat})`,
          shipping_address: finalAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (orderError) throw orderError;
      const insertedOrder = orderData[0];

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          sellerItems.map((item) => ({
            order_id: insertedOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          }))
        );
      if (itemsError) throw itemsError;

      console.log(
        `Created Order #${insertedOrder.id} for Seller #${sellerId}, sub-total: ₹${subTotal}`
      );
    }
  }

  // ----------------------------------
  // Simulate payment
  // ----------------------------------
  const simulatePayment = () => {
    return true; // For testing, always succeed
  };

  // ----------------------------------
  // Handle checkout
  // ----------------------------------
  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        setLoading(false);
        navigate('/auth');
        return;
      }

      if (!simulatePayment()) {
        throw new Error('Payment failed. Please try again.');
      }

      const shippingLocation = location || { lat: 12.9753, lon: 77.591 };
      const finalAddress = manualAddress || address || 'Bangalore, Karnataka, India';

      await placeOrdersForAllSellers(session.user.id, shippingLocation, finalAddress);

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

  // ----------------------------------
  // Render
  // ----------------------------------
  if (loading) return <div className="checkout-loading">Processing...</div>;
  if (error) return <div className="checkout-error">{error}</div>;

  if (orderConfirmed) {
    return (
      <div className="checkout-success">
        <h1>Order Confirmed!</h1>
        <p>Your orders have been placed successfully. Redirecting to your account...</p>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>FreshCart Checkout</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {/* Display Items */}
          <div className="checkout-items">
            {products.map((product, index) => {
              const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
              return (
                <div key={`${product.id}-${index}`} className="checkout-item">
                  <img
                    src={
                      product.images?.[0] ||
                      'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                    }
                    alt={product.name}
                    onError={(e) => {
                      e.target.src =
                        'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    }}
                  />
                  <div className="checkout-item-details">
                    <h3>{product.name}</h3>
                    <p>
                      ₹
                      {product.price.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p>Quantity: {quantity}</p>
                    <p>
                      Seller ID: <strong>{product.seller_id}</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Details */}
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
            {location && address ? (
              <p>
                Detected Address: {address} (Lat {location.lat.toFixed(4)}, Lon{' '}
                {location.lon.toFixed(4)})
              </p>
            ) : (
              <p>Address not detected. Please enter manually.</p>
            )}
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your shipping address..."
              rows="3"
            />

            <h3>Payment Method</h3>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
          </div>

          {/* Action Bar for Button */}
          <div className="action-bar">
            <button onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Place Orders'}
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-icons">
          <span className="icon-circle">🏠</span>
          <span className="icon-circle">🛒</span>
        </div>
        <p>Categories</p>
      </div>
    </div>
  );
}

export default Checkout;