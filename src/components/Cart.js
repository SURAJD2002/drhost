// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom'; // Added import for Link
// import '../style/Cart.css';

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Fetch cart items from localStorage
//     const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//     setCartItems(storedCart);
//     fetchCartProducts(storedCart);
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
//         .select('id, name, price, images')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       if (data) {
//         console.log('Cart products with images:', data);
//         setProducts(data.map(product => ({
//           ...product,
//           images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//         })));
//       }
//     } catch (error) {
//       console.error('Error fetching cart products:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts(products.filter(product => product.id !== productId)); // Update products state
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//   };

//   const total = products.reduce((sum, product) => sum + (product.price || 0), 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <h1 style={{ color: '#007bff' }}>Your Cart</h1>
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product) => (
//               <div key={product.id} className="cart-item">
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   className="cart-item-image"
//                 />
//                 <div className="cart-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#666' }}>₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <button 
//                     onClick={() => removeFromCart(product.id)} 
//                     className="remove-btn"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-total">
//             <h2 style={{ color: '#007bff' }}>Total: ₹{total.toFixed(2).toLocaleString('en-IN')}</h2>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default Cart;


// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom'; // Added import for Link
// import { FaTrash } from 'react-icons/fa';
// import '../style/Cart.css';

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Add message state for feedback

//   useEffect(() => {
//     fetchCartItems();
//   }, []);

//   const fetchCartItems = async () => {
//     setLoading(true);
//     try {
//       // Check authentication
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       // Fetch cart items from localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       // Fetch product details from Supabase using product IDs from cart, with validation
//       if (storedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = storedCart.map(item => item.id).filter(id => id); // Filter out null/undefined IDs
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, name, price, images')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       // Filter out null or invalid products
//       const validProducts = (data || []).filter(product => 
//         product.id && (product.title || product.name) && product.price
//       ).map(product => ({
//         ...product,
//         name: product.title || product.name || 'Unnamed Product', // Use title as primary, then name, then fallback
//         images: Array.isArray(product.images) ? product.images : [], // Ensure images is an array
//       }));

//       setProducts(validProducts);
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       setError(`Error: ${error.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts(products.filter(product => product.id !== productId)); // Update products state
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Item removed from cart successfully!'); // Add success message
//   };

//   const total = products.reduce((sum, product) => sum + (product.price || 0) * (cartItems.find(item => item.id === product.id)?.quantity || 1), 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

//   return (
//     <div className="cart">
//       <h1 style={{ color: '#007bff' }}>FreshCart Cart</h1>
//       {message && <p style={{ color: '#007bff' }}>{message}</p>} {/* Display message */}
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product) => (
//               <div key={product.id} className="cart-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   className="cart-item-image"
//                 />
//                 <div className="cart-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#666' }}>Price: ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <p style={{ color: '#666' }}>
//                     Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}
//                   </p>
//                   <button 
//                     onClick={() => removeFromCart(product.id)} 
//                     className="remove-btn"
//                     style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//                   >
//                     <FaTrash /> Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-total" style={{ marginTop: '20px', color: '#666' }}>
//             <h3>Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
//             <Link to="/checkout" className="checkout-btn" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', textDecoration: 'none' }}>
//               Proceed to Checkout
//             </Link>
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

// export default Cart;

// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import '../style/Cart.css';

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Feedback message

//   useEffect(() => {
//     fetchCartItems();
//   }, []);

//   const fetchCartItems = async () => {
//     setLoading(true);
//     try {
//       // Check authentication
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       // Fetch cart items from localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       // Fetch product details from Supabase using product IDs from cart
//       if (storedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = storedCart.map(item => item.id).filter(id => id); // Filter out null/undefined IDs
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Remove "price" from the select clause since it no longer exists in products table.
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, title, name, images')
//         .in('id', productIds)
//         .eq('is_approved', true);

//       if (error) throw error;

//       // Map products to include a default price of 0
//       const validProducts = (data || [])
//         .filter(product => product.id && (product.title || product.name))
//         .map(product => ({
//           ...product,
//           name: product.title || product.name || 'Unnamed Product',
//           images: Array.isArray(product.images) ? product.images : [],
//           price: 0, // Default price since products.price is no longer available
//         }));

//       setProducts(validProducts);
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       setError(`Error: ${error.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts(products.filter(product => product.id !== productId)); // Update products state
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Item removed from cart successfully!');
//   };

//   // Calculate the total using the default price (0) if no price available
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

//   return (
//     <div className="cart">
//       <h1 style={{ color: '#007bff' }}>FreshCart Cart</h1>
//       {message && <p style={{ color: '#007bff' }}>{message}</p>}
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product) => (
//               <div key={product.id} className="cart-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] || 'https://dummyimage.com/150'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://dummyimage.com/150'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   className="cart-item-image"
//                 />
//                 <div className="cart-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   {/* Price is set to default 0 since products.price no longer exists */}
//                   <p style={{ color: '#666' }}>Price: ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                   <p style={{ color: '#666' }}>
//                     Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}
//                   </p>
//                   <button 
//                     onClick={() => removeFromCart(product.id)} 
//                     className="remove-btn"
//                     style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//                   >
//                     <FaTrash /> Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-total" style={{ marginTop: '20px', color: '#666' }}>
//             <h3>Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
//             <Link to="/checkout" className="checkout-btn" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', textDecoration: 'none' }}>
//               Proceed to Checkout
//             </Link>
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

// export default Cart;



// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import '../style/Cart.css';

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

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Feedback message

//   useEffect(() => {
//     fetchCartItems();
//   }, []);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Check authentication
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       // Fetch cart items from localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       // Fetch product details from Supabase using product IDs from cart
//       if (storedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = storedCart.map(item => item.id).filter(id => id); // Filter out null/undefined IDs
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
//           setError('Error fetching cart items: Schema issue. Contact support.');
//         } else throw error;
//       }

//       const validProducts = (data || [])
//         .filter(product => product.id && (product.title || product.name))
//         .map(product => ({
//           id: product.id,
//           name: product.title || product.name || 'Unnamed Product',
//           images: Array.isArray(product.images) ? product.images : (Array.isArray(product.product_variants?.[0]?.images) ? product.product_variants[0].images : ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg']),
//           price: product.product_variants?.[0]?.price || 0,
//         }));

//       setProducts(validProducts);
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       setError(`Error: ${error.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts(products.filter(product => product.id !== productId)); // Update products state
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Item removed from cart successfully!');
//   };

//   // Calculate the total using the price from product_variants
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

//   return (
//     <div className="cart">
//       <h1 style={{ color: '#007bff' }}>FreshCart Cart</h1>
//       {message && <p style={{ color: '#007bff' }}>{message}</p>}
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product) => (
//               <div key={product.id} className="cart-item" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', margin: '10px' }}>
//                 <img 
//                   src={product.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'} 
//                   alt={product.name} 
//                   onError={(e) => { 
//                     e.target.src = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'; 
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//                   }}
//                   className="cart-item-image"
//                 />
//                 <div className="cart-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#000', margin: '5px 0' }}>
//                     Price: ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
//                   </p>
//                   <p style={{ color: '#666', margin: '5px 0' }}>
//                     Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}
//                   </p>
//                   <button 
//                     onClick={() => removeFromCart(product.id)} 
//                     className="remove-btn"
//                     style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
//                   >
//                     <FaTrash /> Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-total" style={{ marginTop: '20px', color: '#666' }}>
//             <h3>Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
//             <Link to="/checkout" className="checkout-btn" style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', textDecoration: 'none' }}>
//               Proceed to Checkout
//             </Link>
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

// export default Cart;


// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import '../style/Cart.css';

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

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(''); // Feedback message

//   useEffect(() => {
//     fetchCartItems();
//   }, []);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Check authentication
//       let { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       // Fetch cart items from localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       // If cart is empty, no need to fetch product details
//       if (storedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Collect product IDs from the cart
//       const productIds = storedCart.map(item => item.id).filter(id => id);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch product details from Supabase
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
//           setError('Error fetching cart items: Schema issue. Contact support.');
//         } else {
//           throw error;
//         }
//       }

//       // Build a "validProducts" array with safe fallback for images and price
//       const validProducts = (data || [])
//         .filter(product => product.id && (product.title || product.name))
//         .map(product => {
//           // Find the first variant that actually has images
//           const variantWithImages = product.product_variants?.find(
//             (variant) => Array.isArray(variant.images) && variant.images.length > 0
//           );

//           // Decide which images to use:
//           // 1) If product.images is non-empty, use that.
//           // 2) Otherwise, use the first variant that has images.
//           // 3) Otherwise, fallback to a default image.
//           const finalImages = (Array.isArray(product.images) && product.images.length > 0)
//             ? product.images
//             : (variantWithImages
//                 ? variantWithImages.images
//                 : ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg']);

//           // Decide which price to use:
//           // 1) Use the price from the variant with images if it exists.
//           // 2) Otherwise, fallback to product_variants[0].price if available.
//           // 3) Otherwise, default to 0.
//           const finalPrice = variantWithImages?.price
//             ?? product.product_variants?.[0]?.price
//             ?? 0;

//           return {
//             id: product.id,
//             name: product.title || product.name || 'Unnamed Product',
//             images: finalImages,
//             price: finalPrice,
//           };
//         });

//       setProducts(validProducts);
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//       setError(`Error: ${error.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts(products.filter(product => product.id !== productId)); // Update products state
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Item removed from cart successfully!');
//   };

//   // Calculate the total using the price from product_variants
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

//   return (
//     <div className="cart">
//       <h1 style={{ color: '#007bff' }}>FreshCart Cart</h1>
//       {message && <p style={{ color: '#007bff' }}>{message}</p>}
//       {cartItems.length === 0 ? (
//         <p style={{ color: '#666' }}>Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="cart-item"
//                 style={{
//                   border: '1px solid #ccc',
//                   borderRadius: '8px',
//                   padding: '10px',
//                   margin: '10px'
//                 }}
//               >
//                 <img
//                   src={
//                     product.images?.[0] ||
//                     'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                   }
//                   alt={product.name}
//                   onError={(e) => {
//                     // If the image fails to load, set a fallback
//                     e.target.src =
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]);
//                   }}
//                   className="cart-item-image"
//                 />
//                 <div className="cart-item-details">
//                   <h3 style={{ color: '#007bff' }}>{product.name}</h3>
//                   <p style={{ color: '#000', margin: '5px 0' }}>
//                     Price: ₹
//                     {product.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2
//                     }) || 'N/A'}
//                   </p>
//                   <p style={{ color: '#666', margin: '5px 0' }}>
//                     Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}
//                   </p>
//                   <button
//                     onClick={() => removeFromCart(product.id)}
//                     className="remove-btn"
//                     style={{
//                       backgroundColor: '#ff4444',
//                       color: 'white',
//                       border: 'none',
//                       padding: '8px 16px',
//                       borderRadius: '5px',
//                       cursor: 'pointer'
//                     }}
//                   >
//                     <FaTrash /> Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-total" style={{ marginTop: '20px', color: '#666' }}>
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2
//               })}
//             </h3>
//             <Link
//               to="/checkout"
//               className="checkout-btn"
//               style={{
//                 backgroundColor: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 20px',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//                 textDecoration: 'none'
//               }}
//             >
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <div
//         className="footer"
//         style={{
//           backgroundColor: '#f8f9fa',
//           padding: '10px',
//           textAlign: 'center',
//           color: '#666',
//           marginTop: '20px'
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
//               color: 'white'
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
//               color: 'white'
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

// export default Cart;


import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import '../style/Cart.css';

// Custom retry function for Supabase requests
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    try {
      // Check authentication
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        setLoading(false);
        return;
      }

      // Fetch cart items from localStorage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);

      // If cart is empty, no need to fetch product details
      if (storedCart.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Collect product IDs from the cart
      const productIds = storedCart.map(item => item.id).filter(id => id);
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch product details from Supabase, including price from products table
      const { data, error } = await retryRequest(() =>
        supabase
          .from('products')
          .select('id, title, name, price, images, product_variants!product_variants_product_id_fkey(price, images)')
          .in('id', productIds)
          .eq('is_approved', true)
      );

      if (error) {
        if (error.code === '42703') {
          console.error('Schema error: column issue detected. Check foreign key and schema cache.', error);
          setError('Error fetching cart items: Schema issue. Contact support.');
        } else {
          throw error;
        }
      }

      // Build a "validProducts" array with safe fallback for images and price
      const validProducts = (data || [])
        .filter(product => product.id && (product.title || product.name))
        .map(product => {
          // Find the first variant that actually has images
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

          console.log(`Cart Product ID ${product.id} (${product.title || product.name}):`, {
            productPrice,
            variantPrice,
            finalPrice,
            product_variants: product.product_variants,
          });

          return {
            id: product.id,
            name: product.title || product.name || 'Unnamed Product',
            images: finalImages,
            price: finalPrice,
          };
        });

      setProducts(validProducts);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setError(`Error: ${error.message || 'Failed to load cart. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    setProducts(products.filter(product => product.id !== productId)); // Update products state
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setMessage('Item removed from cart successfully!');
  };

  // Calculate the total using the price from products or variants
  const total = products.reduce((sum, product) => {
    const quantity = cartItems.find(item => item.id === product.id)?.quantity || 1;
    return sum + (product.price || 0) * quantity;
  }, 0);

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

  return (
    <div className="cart">
      <h1 style={{ color: '#007bff' }}>FreshCart Cart</h1>
      {message && <p style={{ color: '#007bff' }}>{message}</p>}
      {cartItems.length === 0 ? (
        <p style={{ color: '#666' }}>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {products.map((product) => (
              <div
                key={product.id}
                className="cart-item"
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '10px',
                  margin: '10px'
                }}
              >
                <img
                  src={
                    product.images?.[0] ||
                    'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                  }
                  alt={product.name}
                  onError={(e) => {
                    e.target.src =
                      'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]);
                  }}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3 style={{ color: '#007bff' }}>{product.name}</h3>
                  <p style={{ color: '#000', margin: '5px 0' }}>
                    Price: ₹
                    {product.price.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <p style={{ color: '#666', margin: '5px 0' }}>
                    Quantity: {cartItems.find(item => item.id === product.id)?.quantity || 1}
                  </p>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="remove-btn"
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total" style={{ marginTop: '20px', color: '#666' }}>
            <h3>
              Total: ₹
              {total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </h3>
            <Link
              to="/checkout"
              className="checkout-btn"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
      <div
        className="footer"
        style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          textAlign: 'center',
          color: '#666',
          marginTop: '20px'
        }}
      >
        <div
          className="footer-icons"
          style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
        >
          <span
            className="icon-circle"
            style={{
              backgroundColor: '#007bff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            🏠
          </span>
          <span
            className="icon-circle"
            style={{
              backgroundColor: '#007bff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            🛒
          </span>
        </div>
        <p style={{ color: '#007bff' }}>Categories</p>
      </div>
    </div>
  );
}

export default Cart;