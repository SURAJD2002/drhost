
// // src/components/Cart.js

// import React, { useState, useEffect, useCallback } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import '../style/Cart.css';

// // Custom retry function for Supabase requests (exponential backoff)
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

// function Cart() {
//   const [cartItems, setCartItems] = useState([]);   // local cart data from localStorage
//   const [products, setProducts] = useState([]);       // fetched product details from Supabase
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   // ----------------------------------
//   // On mount, load the cart from localStorage and fetch product details
//   // ----------------------------------
//   useEffect(() => {
//     fetchCartItems();
//   }, []);

//   // ----------------------------------
//   // Fetch items from localStorage, then load product info from Supabase
//   // ----------------------------------
//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       // 1) Check authentication (optional)
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       // 2) Load cart from localStorage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(storedCart);

//       // 3) If cart is empty, we're done
//       if (storedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // 4) Collect product IDs
//       const productIds = storedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // 5) Fetch product details from Supabase
//       const { data, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             title,
//             name,
//             price,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );

//       if (fetchError) throw fetchError;

//       // 6) Merge local variant data with fetched product details
//       const validProducts = (data || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           // Find the local cart item for this product
//           const storedItem = storedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
//             };
//           }
//           // Fallback: if no variant info, use product's default images and price
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

//       setProducts(validProducts);
//     } catch (err) {
//       console.error('Error fetching cart items:', err);
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ----------------------------------
//   // Remove item from cart (update localStorage and state)
//   // ----------------------------------
//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Item removed from cart successfully!');
//   };

//   // ----------------------------------
//   // Increase item quantity
//   // ----------------------------------
//   const increaseQuantity = (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: (item.quantity || 1) + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Cart updated!');
//   };

//   // ----------------------------------
//   // Decrease item quantity (minimum 1)
//   // ----------------------------------
//   const decreaseQuantity = (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setMessage('Cart updated!');
//   };

//   // ----------------------------------
//   // Compute total cost
//   // ----------------------------------
//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   // ----------------------------------
//   // Render
//   // ----------------------------------
//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error" style={{ color: '#ff0000' }}>{error}</div>;

//   return (
//     <div className="cart">
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {message && <p className="cart-message">{message}</p>}
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div
//                   key={`${product.id}-${index}`}  // Unique composite key
//                   className="cart-item"
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
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}

//       {/* Footer */}
//       <div className="cart-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';

// // Custom retry function for Supabase requests (exponential backoff)
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

// function Cart({ setCartCount }) {
//   console.log('Cart.js: Rendering');
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Remove selected_variant from the query
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity').eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             selectedVariant: null, // No selected_variant from Supabase
//           });
//           productIdsSet.add(item.product_id);
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
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
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       console.error('Error fetching cart items:', err);
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCart = async (userId, updatedCart) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId)
//       );
//       if (deleteError) throw deleteError;

//       if (updatedCart.length > 0) {
//         const cartToInsert = updatedCart.map((item) => ({
//           user_id: userId,
//           product_id: item.id,
//           quantity: item.quantity || 1,
//           // Remove selected_variant from insert
//         }));
//         const { error: insertError } = await retryRequest(() =>
//           supabase.from('cart').insert(cartToInsert)
//         );
//         if (insertError) throw insertError;
//       }
//     } catch (err) {
//       console.error('Error updating Supabase cart:', err);
//       setError('Failed to sync cart with server. Changes may not persist.');
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Item removed from cart successfully!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: (item.quantity || 1) + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {message && <p className="cart-message">{message}</p>}
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div
//                   key={`${product.id}-${index}`}
//                   className="cart-item"
//                 >
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
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}

//       <div className="cart-footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Cart;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';

// // Custom retry function for Supabase requests (exponential backoff)
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

// function Cart({ setCartCount }) {
//   console.log('Cart.js: Rendering');
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Simplified query with better error handling
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         console.error('Supabase Error Details:', supabaseError);
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             selectedVariant: null,
//           });
//           productIdsSet.add(item.product_id);
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
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
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       console.error('Error fetching cart items:', err);
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     console.log('useEffect triggered with buyerLocation:', buyerLocation);
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCart = async (userId, updatedCart) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId)
//       );
//       if (deleteError) throw deleteError;

//       if (updatedCart.length > 0) {
//         const cartToInsert = updatedCart.map((item) => ({
//           user_id: userId,
//           product_id: item.id,
//           quantity: item.quantity || 1,
//         }));
//         const { error: insertError } = await retryRequest(() =>
//           supabase.from('cart').insert(cartToInsert)
//         );
//         if (insertError) throw insertError;
//       }
//     } catch (err) {
//       console.error('Error updating Supabase cart:', err);
//       setError('Failed to sync cart with server. Changes may not persist.');
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Item removed from cart successfully!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: (item.quantity || 1) + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {message && <p className="cart-message">{message}</p>}
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               return (
//                 <div
//                   key={`${product.id}-${index}`}
//                   className="cart-item"
//                 >
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
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';

// // Custom retry function for Supabase requests (exponential backoff)
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

// function Cart({ setCartCount }) {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items with variant_id instead of selected_variant
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         console.error('Supabase Error Details:', supabaseError);
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       // Merge stored cart (localStorage) with Supabase cart
//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       // Fetch variant details for Supabase cart items
//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       // Merge Supabase cart items
//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
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
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       console.error('Error fetching cart items:', err);
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     console.log('useEffect triggered with buyerLocation:', buyerLocation);
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCart = async (userId, updatedCart) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId)
//       );
//       if (deleteError) throw deleteError;

//       if (updatedCart.length > 0) {
//         const cartToInsert = updatedCart.map((item) => ({
//           user_id: userId,
//           product_id: item.id,
//           quantity: item.quantity || 1,
//           variant_id: item.variantId || null, // Use variant_id instead of selected_variant
//         }));
//         const { error: insertError } = await retryRequest(() =>
//           supabase.from('cart').insert(cartToInsert)
//         );
//         if (insertError) throw insertError;
//       }
//     } catch (err) {
//       console.error('Error updating Supabase cart:', err);
//       setError('Failed to sync cart with server. Changes may not persist.');
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Item removed from cart successfully!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: (item.quantity || 1) + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     setMessage('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await updateSupabaseCart(session.user.id, updatedCart);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {message && <p className="cart-message">{message}</p>}
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Custom retry function for Supabase requests (exponential backoff)
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

// function Cart({ setCartCount }) {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             stock,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images, stock)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//           const productStock =
//             product.stock !== undefined
//               ? product.stock
//               : variantWithImages?.stock !== undefined
//               ? variantWithImages.stock
//               : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, productId, updatedItem) => {
//     try {
//       // Update or insert the specific cart item
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['user_id', 'product_id'] }
//           )
//       );
//       if (upsertError) throw upsertError;
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error('Failed to sync cart with server.');
//     }
//   };

//   const removeFromSupabaseCart = async (userId, productId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId)
//       );
//       if (deleteError) throw deleteError;
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error('Failed to sync cart with server.');
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, productId);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.id === productId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.');
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!');

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;

// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

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

// function Cart({ setCartCount }) {
//   const { buyerLocation } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             stock,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images, stock)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//           const productStock =
//             product.stock !== undefined
//               ? product.stock
//               : variantWithImages?.stock !== undefined
//               ? variantWithImages.stock
//               : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['user_id', 'product_id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, productId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, productId);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.id === productId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

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

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext); // Get setCartCount from context
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length); // Update cartCount in context

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             stock,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images, stock)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//           const productStock =
//             product.stock !== undefined
//               ? product.stock
//               : variantWithImages?.stock !== undefined
//               ? variantWithImages.stock
//               : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['user_id', 'product_id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, productId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length); // Update cartCount in context
//     toast.success('Item removed from cart successfully!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, productId);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.id === productId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length); // Update cartCount in context
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length); // Update cartCount in context
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <ToastContainer position="top-center" autoClose={3000} />
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={product.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Helmet } from 'react-helmet-async'; // Added

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
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

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             stock,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images, stock)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//           const productStock =
//             product.stock !== undefined
//               ? product.stock
//               : variantWithImages?.stock !== undefined
//               ? variantWithImages.stock
//               : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['user_id', 'product_id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, productId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, productId);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.id === productId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: "top-center",
//       autoClose: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" /> {/* Cart is user-specific, so noindex */}
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             name: "Shopping Cart - Markeet",
//             description: "View and manage your shopping cart on Markeet.",
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <ToastContainer position="top-center" autoClose={3000} />
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
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

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) {
//         throw supabaseError;
//       }

//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.selectedVariant?.id || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = mergedCart.map((item) => item.id).filter(Boolean);
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const { data: productData, error: fetchError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             stock,
//             images,
//             product_variants!product_variants_product_id_fkey(price, images, stock)
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (fetchError) throw fetchError;

//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find((item) => item.id === product.id);
//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.price,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length
//                 ? storedItem.selectedVariant.images
//                 : product.images,
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
//           const productStock =
//             product.stock !== undefined
//               ? product.stock
//               : variantWithImages?.stock !== undefined
//               ? variantWithImages.stock
//               : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, productId, updatedItem) => {
//     try {
//       const { error: Uploader } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['user_id', 'product_id'] }
//           )
//       );
//       if (Uploader) {
//         console.error('Upsert error details:', Uploader.message, Uploader.code, Uploader.details);
//         if (Uploader.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         throw Uploader;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, productId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('user_id', userId).eq('product_id', productId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     const updatedCart = cartItems.filter((item) => item.id !== productId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, productId);
//     }
//   };

//   const increaseQuantity = async (productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.id === productId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.id === productId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.id === productId);
//       await updateSupabaseCartItem(session.user.id, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//     return sum + (product.price || 0) * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             name: "Shopping Cart - Markeet",
//             description: "View and manage your shopping cart on Markeet.",
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(selectedVariant?.price || product.price).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
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

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, quantity, variant_id').eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach(item => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             cartId: item.cartId,
//             quantity: item.quantity || 1,
//             variantId: item.variantId || null,
//             selectedVariant: item.selectedVariant || null,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       // Process Supabase cart items
//       const variantIds = supabaseCart
//         .filter(item => item.variant_id)
//         .map(item => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = variant;
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach(item => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(i => i.id === item.product_id && i.variantId === item.variant_id);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//             };
//           } else {
//             mergedCart.push({
//               id: item.product_id,
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//             });
//             productIdsSet.add(item.product_id);
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map(item => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products without relying on foreign key relationship
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             stock,
//             images,
//             discount_amount,
//             commission_amount
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, images, stock')
//           .in('product_id', productIds)
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter(product => product.id && (product.title || product.name))
//         .map(product => {
//           const seller = sellersData.find(s => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const storedItem = mergedCart.find(item => item.id === product.id && item.variantId === (variantData.find(v => v.id === item.variantId)?.id || null));
//           const variants = variantData.filter(v => v.product_id === product.id);

//           if (storedItem?.selectedVariant) {
//             return {
//               ...product,
//               selectedVariant: storedItem.selectedVariant,
//               price: storedItem.selectedVariant.price || product.original_price || product.price || 0,
//               stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
//               images: storedItem.selectedVariant.images?.length ? storedItem.selectedVariant.images : product.images,
//               product_variants: variants,
//             };
//           }

//           // Find matching variant if variant_id exists
//           const variant = storedItem?.variantId ? variants.find(v => v.id === storedItem.variantId) : null;
//           if (variant) {
//             return {
//               ...product,
//               selectedVariant: variant,
//               price: variant.price || product.original_price || product.price || 0,
//               stock: variant.stock !== undefined ? variant.stock : product.stock,
//               images: variant.images?.length ? variant.images : product.images,
//               product_variants: variants,
//             };
//           }

//           const variantWithImages = variants.find(v => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = product.images?.length
//             ? product.images
//             : variantWithImages?.images || [
//                 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
//               ];
//           const productPrice = product.original_price || product.price || variantWithImages?.price || 0;
//           const productStock = product.stock !== undefined
//             ? product.stock
//             : variantWithImages?.stock !== undefined
//             ? variantWithImages.stock
//             : 0;
//           return {
//             ...product,
//             images: finalImages,
//             price: productPrice,
//             stock: productStock,
//             product_variants: variants,
//           };
//         })
//         .filter(p => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (cartId, productId) => {
//     const updatedCart = cartItems.filter(item => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts(prev => prev.filter(product => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, cartId);
//     }
//   };

//   const increaseQuantity = async (cartId, productId) => {
//     const product = products.find(p => p.id === productId);
//     const cartItem = cartItems.find(item => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map(item => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, updatedItem);
//     }
//   };

//   const decreaseQuantity = async (cartId, productId) => {
//     const updatedCart = cartItems.map(item => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find(item => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, updatedItem);
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.id && item.variantId === (product.selectedVariant?.id || null));
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={products[0]?.images?.[0] || 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             name: "Shopping Cart - Markeet",
//             description: "View and manage your shopping cart on Markeet.",
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.id && item.variantId === (product.selectedVariant?.id || null));
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${cartItem?.cartId || index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       {product.title || product.name || 'Unnamed Product'}
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           - {Object.entries(selectedVariant.attributes || {})
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="cart-item-price">
//                       ₹
//                       {(product.price || 0).toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">Discount: ₹{product.discount_amount}</p>
//                     )}
//                     {product.commission_amount > 0 && (
//                       <p className="cart-item-commission">Commission: ₹{product.commission_amount}</p>
//                     )}
//                     <div className="cart-quantity">
//                       <button onClick={() => decreaseQuantity(cartItem?.cartId, product.id)} className="qty-btn">-</button>
//                       <span className="qty-display">{quantity}</span>
//                       <button onClick={() => increaseQuantity(cartItem?.cartId, product.id)} className="qty-btn">+</button>
//                     </div>
//                     <button onClick={() => removeFromCart(cartItem?.cartId, product.id)} className="remove-btn">
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Total: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productIdsSet = new Set();

//       storedCart.forEach((item) => {
//         if (item.id) {
//           mergedCart.push({
//             id: item.id,
//             cartId: item.cartId,
//             quantity: item.quantity || 1,
//             variantId: item.variantId || null,
//             selectedVariant: item.selectedVariant || null,
//             price: item.price || 0,
//             original_price: item.original_price || null,
//             discount_amount: item.discount_amount || 0,
//           });
//           productIdsSet.add(item.id);
//         }
//       });

//       // Process Supabase cart items
//       const variantIds = supabaseCart.filter((item) => item.variant_id).map((item) => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//           };
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach((item) => {
//         if (!productIdsSet.has(item.product_id)) {
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//             price: item.price || 0,
//             original_price: item.variant_id ? variantDetails[item.variant_id]?.original_price : null,
//             discount_amount: item.variant_id ? variantDetails[item.variant_id]?.discount_amount : 0,
//           });
//           productIdsSet.add(item.product_id);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(
//             (i) => i.id === item.product_id && i.variantId === item.variant_id
//           );
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//               price: item.price || mergedCart[existingItemIndex].price,
//               original_price: item.variant_id
//                 ? variantDetails[item.variant_id]?.original_price
//                 : mergedCart[existingItemIndex].original_price,
//               discount_amount: item.variant_id
//                 ? variantDetails[item.variant_id]?.discount_amount
//                 : mergedCart[existingItemIndex].discount_amount,
//             };
//           } else {
//             mergedCart.push({
//               id: item.product_id,
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//               price: item.price || 0,
//               original_price: item.variant_id ? variantDetails[item.variant_id]?.original_price : null,
//               discount_amount: item.variant_id ? variantDetails[item.variant_id]?.discount_amount : 0,
//             });
//             productIdsSet.add(item.product_id);
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             discount_amount,
//             stock,
//             images
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('product_id', productIds)
//           .eq('status', 'active')
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const cartItem = mergedCart.find(
//             (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//           );
//           const variants = variantData.filter((v) => v.product_id === product.id);

//           const parsedProduct = {
//             ...product,
//             price: parseFloat(product.price) || 0,
//             original_price: product.original_price ? parseFloat(product.original_price) : null,
//             discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//           };

//           if (cartItem?.selectedVariant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...cartItem.selectedVariant,
//                 price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                 original_price: cartItem.selectedVariant.original_price
//                   ? parseFloat(cartItem.selectedVariant.original_price)
//                   : parsedProduct.original_price,
//                 discount_amount: cartItem.selectedVariant.discount_amount
//                   ? parseFloat(cartItem.selectedVariant.discount_amount)
//                   : parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length
//                   ? cartItem.selectedVariant.images
//                   : parsedProduct.images,
//               },
//               price: cartItem.price || parsedProduct.price,
//               original_price: cartItem.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//               stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//               images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//           if (variant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...variant,
//                 price: parseFloat(variant.price) || parsedProduct.price,
//                 original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                 discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                 stock: variant.stock || parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//               },
//               price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//               original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//               stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//               images: variant.images?.length ? variant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = parsedProduct.images?.length
//             ? parsedProduct.images
//             : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//           return {
//             ...parsedProduct,
//             images: finalImages,
//             product_variants: variants.map((v) => ({
//               ...v,
//               price: parseFloat(v.price) || 0,
//               original_price: v.original_price ? parseFloat(v.original_price) : null,
//               discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//               stock: v.stock || 0,
//             })),
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//          supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['user_id', 'product_id', 'variant_id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (cartId, productId) => {
//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => product.id !== productId));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, cartId);
//     }
//   };

//   const increaseQuantity = async (cartId, productId) => {
//     const product = products.find((p) => p.id === productId);
//     const cartItem = cartItems.find((item) => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: product.title || product.name,
//       });
//     }
//   };

//   const decreaseQuantity = async (cartId, productId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: products.find((p) => p.id === productId)?.title || 'Unnamed Product',
//       });
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//               );
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${cartItem?.cartId || index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`}>
//                         {product.title || product.name || 'Unnamed Product'}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹
//                         {(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹
//                           {product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹
//                         {(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => decreaseQuantity(cartItem?.cartId, product.id)}
//                         className="qty-btn"
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display">{quantity}</span>
//                       <button
//                         onClick={() => increaseQuantity(cartItem?.cartId, product.id)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem?.cartId, product.id)}
//                       className="remove-btn"
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹
//                 {discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;

// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       storedCart.forEach((item) => {
//         if (item.id) {
//           const key = `${item.id}-${item.variantId || 'no-variant'}`;
//           if (!productVariantSet.has(key)) {
//             mergedCart.push({
//               id: item.id,
//               cartId: item.cartId,
//               quantity: item.quantity || 1,
//               variantId: item.variantId || null,
//               selectedVariant: item.selectedVariant || null,
//               price: item.price || 0,
//               original_price: item.original_price || null,
//               discount_amount: item.discount_amount || 0,
//               title: item.title || 'Unnamed Product',
//             });
//             productVariantSet.add(key);
//           }
//         }
//       });

//       // Process Supabase cart items
//       const variantIds = supabaseCart.filter((item) => item.variant_id).map((item) => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//           };
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach((item) => {
//         const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
//         if (!productVariantSet.has(key)) {
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//             price: item.price || 0,
//             original_price: item.variant_id ? variantDetails[item.variant_id]?.original_price : null,
//             discount_amount: item.variant_id ? variantDetails[item.variant_id]?.discount_amount : 0,
//             title: item.title || 'Unnamed Product',
//           });
//           productVariantSet.add(key);
//         } else {
//           const existingItemIndex = mergedCart.findIndex(
//             (i) => i.id === item.product_id && i.variantId === item.variant_id
//           );
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               variantId: item.variant_id || null,
//               selectedVariant: item.variant_id ? variantDetails[item.variant_id] : mergedCart[existingItemIndex].selectedVariant,
//               price: item.price || mergedCart[existingItemIndex].price,
//               original_price: item.variant_id
//                 ? variantDetails[item.variant_id]?.original_price
//                 : mergedCart[existingItemIndex].original_price,
//               discount_amount: item.variant_id
//                 ? variantDetails[item.variant_id]?.discount_amount
//                 : mergedCart[existingItemIndex].discount_amount,
//               title: item.title || mergedCart[existingItemIndex].title,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             discount_amount,
//             stock,
//             images
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('product_id', productIds)
//           .eq('status', 'active')
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const cartItem = mergedCart.find(
//             (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//           );
//           const variants = variantData.filter((v) => v.product_id === product.id);

//           const parsedProduct = {
//             ...product,
//             price: parseFloat(product.price) || 0,
//             original_price: product.original_price ? parseFloat(product.original_price) : null,
//             discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//           };

//           if (cartItem?.selectedVariant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...cartItem.selectedVariant,
//                 price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                 original_price: cartItem.selectedVariant.original_price
//                   ? parseFloat(cartItem.selectedVariant.original_price)
//                   : parsedProduct.original_price,
//                 discount_amount: cartItem.selectedVariant.discount_amount
//                   ? parseFloat(cartItem.selectedVariant.discount_amount)
//                   : parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length
//                   ? cartItem.selectedVariant.images
//                   : parsedProduct.images,
//               },
//               price: cartItem.price || parsedProduct.price,
//               original_price: cartItem.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//               stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//               images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//           if (variant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...variant,
//                 price: parseFloat(variant.price) || parsedProduct.price,
//                 original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                 discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                 stock: variant.stock || parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//               },
//               price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//               original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//               stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//               images: variant.images?.length ? variant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = parsedProduct.images?.length
//             ? parsedProduct.images
//             : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//           return {
//             ...parsedProduct,
//             images: finalImages,
//             product_variants: variants.map((v) => ({
//               ...v,
//               price: parseFloat(v.price) || 0,
//               original_price: v.original_price ? parseFloat(v.original_price) : null,
//               discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//               stock: v.stock || 0,
//             })),
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['user_id', 'product_id', 'variant_id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (cartId, productId, variantId) => {
//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => !(product.id === productId && product.selectedVariant?.id === variantId)));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, cartId);
//     }
//   };

//   const increaseQuantity = async (cartId, productId, variantId) => {
//     const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//     const cartItem = cartItems.find((item) => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: product.title || product.name,
//       });
//     }
//   };

//   const decreaseQuantity = async (cartId, productId, variantId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: products.find((p) => p.id === productId && p.selectedVariant?.id === variantId)?.title || 'Unnamed Product',
//       });
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//               );
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={`${product.id}-${cartItem?.cartId || index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`}>
//                         {product.title || product.name || 'Unnamed Product'}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹
//                         {(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹
//                           {product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹
//                         {(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => decreaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display">{quantity}</span>
//                       <button
//                         onClick={() => increaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹
//                 {discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Authentication required. Please ensure you are logged in.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       storedCart.forEach((item) => {
//         if (item.id && item.uniqueKey) {
//           const key = item.uniqueKey;
//           if (!productVariantSet.has(key)) {
//             mergedCart.push({
//               id: item.id,
//               cartId: item.cartId,
//               quantity: item.quantity || 1,
//               variantId: item.variantId || null,
//               selectedVariant: item.selectedVariant || null,
//               price: item.price || 0,
//               original_price: item.original_price || null,
//               discount_amount: item.discount_amount || 0,
//               title: item.title || 'Unnamed Product',
//               images: item.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//               uniqueKey: item.uniqueKey,
//             });
//             productVariantSet.add(key);
//           }
//         }
//       });

//       // Process Supabase cart items
//       const variantIds = supabaseCart.filter((item) => item.variant_id).map((item) => item.variant_id);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//             images: variant.images || [],
//           };
//           return acc;
//         }, {});
//       }

//       supabaseCart.forEach((item) => {
//         const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
//         if (!productVariantSet.has(key)) {
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: item.variant_id ? variantDetails[item.variant_id] : null,
//             price: item.price || 0,
//             original_price: item.variant_id ? variantDetails[item.variant_id]?.original_price : null,
//             discount_amount: item.variant_id ? variantDetails[item.variant_id]?.discount_amount : 0,
//             title: item.title || 'Unnamed Product',
//             images: item.variant_id ? variantDetails[item.variant_id]?.images : [],
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         } else {
//           const existingItemIndex = mergedCart.findIndex((i) => i.uniqueKey === key);
//           if (existingItemIndex !== -1) {
//             mergedCart[existingItemIndex] = {
//               ...mergedCart[existingItemIndex],
//               cartId: item.id,
//               quantity: item.quantity || 1,
//               price: item.price || mergedCart[existingItemIndex].price,
//               title: item.title || mergedCart[existingItemIndex].title,
//             };
//           }
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             discount_amount,
//             stock,
//             images
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('product_id', productIds)
//           .eq('status', 'active')
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const cartItem = mergedCart.find(
//             (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//           );
//           const variants = variantData.filter((v) => v.product_id === product.id);

//           const parsedProduct = {
//             ...product,
//             price: parseFloat(product.price) || 0,
//             original_price: product.original_price ? parseFloat(product.original_price) : null,
//             discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: cartItem?.uniqueKey || `${product.id}-no-variant`,
//           };

//           if (cartItem?.selectedVariant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...cartItem.selectedVariant,
//                 price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                 original_price: cartItem.selectedVariant.original_price
//                   ? parseFloat(cartItem.selectedVariant.original_price)
//                   : parsedProduct.original_price,
//                 discount_amount: cartItem.selectedVariant.discount_amount
//                   ? parseFloat(cartItem.selectedVariant.discount_amount)
//                   : parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length
//                   ? cartItem.selectedVariant.images
//                   : parsedProduct.images,
//               },
//               price: cartItem.price || parsedProduct.price,
//               original_price: cartItem.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//               stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//               images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//           if (variant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...variant,
//                 price: parseFloat(variant.price) || parsedProduct.price,
//                 original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                 discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                 stock: variant.stock || parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//               },
//               price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//               original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//               stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//               images: variant.images?.length ? variant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = parsedProduct.images?.length
//             ? parsedProduct.images
//             : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//           return {
//             ...parsedProduct,
//             images: finalImages,
//             product_variants: variants.map((v) => ({
//               ...v,
//               price: parseFloat(v.price) || 0,
//               original_price: v.original_price ? parseFloat(v.original_price) : null,
//               discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//               stock: v.stock || 0,
//             })),
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
//       toast.error(`Failed to load cart: ${err.message || 'Unknown error'}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) {
//         console.error('Upsert error details:', upsertError.message, upsertError.code, upsertError.details);
//         if (upsertError.code === '42P10') {
//           setError('Database constraint missing. Please contact support to fix the cart table.');
//           toast.error('Database issue detected. Changes may not sync.', {
//             position: 'top-center',
//             duration: 3000,
//           });
//         }
//         throw upsertError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message || 'Unknown error'}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) {
//         console.error('Delete error details:', deleteError.message, deleteError.code, deleteError.details);
//         throw deleteError;
//       }
//     } catch (err) {
//       setError('Failed to sync cart with server. Changes may not persist.');
//       toast.error(`Failed to sync cart with server: ${err.message || 'Unknown error'}`, {
//         position: 'top-center',
//         duration: 3000,
//       });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromCart = async (cartId, productId, variantId) => {
//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => !(product.id === productId && product.selectedVariant?.id === variantId)));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Item removed from cart successfully!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       await removeFromSupabaseCart(session.user.id, cartId);
//     }
//   };

//   const increaseQuantity = async (cartId, productId, variantId) => {
//     const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//     const cartItem = cartItems.find((item) => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Cannot add more items. Stock limit reached.', {
//         position: 'top-center',
//         duration: 3000,
//       });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: product.title || product.name,
//       });
//     }
//   };

//   const decreaseQuantity = async (cartId, productId, variantId) => {
//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', {
//       position: 'top-center',
//       duration: 3000,
//     });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: products.find((p) => p.id === productId && p.selectedVariant?.id === variantId)?.title || 'Unnamed Product',
//       });
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.uniqueKey === product.uniqueKey
//               );
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={cartItem?.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`}>
//                         {product.title || product.name || 'Unnamed Product'}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹
//                         {(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹
//                           {product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹
//                         {(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => decreaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display">{quantity}</span>
//                       <button
//                         onClick={() => increaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹
//                 {discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to view your cart.');
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items from Supabase
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage and sync unsynced items
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       // Process Supabase cart items first
//       supabaseCart.forEach((item) => {
//         if (item.id) {
//           const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: null, // Populated later
//             price: item.price || 0,
//             title: item.title || 'Unnamed Product',
//             images: [], // Populated later
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       });

//       // Sync local storage items to Supabase if not already present
//       for (const item of storedCart) {
//         if (item.id && item.uniqueKey && !productVariantSet.has(item.uniqueKey)) {
//           // Insert unsynced item into Supabase
//           const { data, error } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: item.id,
//               variant_id: item.variantId || null,
//               quantity: item.quantity || 1,
//               price: item.price || 0,
//               title: item.title || 'Unnamed Product',
//             })
//             .select('id')
//             .single();
//           if (error) {
//             console.error('Failed to sync local storage item:', error);
//             continue; // Skip item if sync fails
//           }

//           const key = item.uniqueKey;
//           mergedCart.push({
//             id: item.id,
//             cartId: data.id, // Use new Supabase ID
//             quantity: item.quantity || 1,
//             variantId: item.variantId || null,
//             selectedVariant: item.selectedVariant || null,
//             price: item.price || 0,
//             original_price: item.original_price || null,
//             discount_amount: item.discount_amount || 0,
//             title: item.title || 'Unnamed Product',
//             images: item.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       }

//       // Fetch variant details
//       const variantIds = mergedCart.filter((item) => item.variantId).map((item) => item.variantId);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//             images: variant.images || [],
//           };
//           return acc;
//         }, {});
//       }

//       // Update mergedCart with variant details
//       mergedCart.forEach((item) => {
//         if (item.variantId && variantDetails[item.variantId]) {
//           item.selectedVariant = variantDetails[item.variantId];
//           item.price = variantDetails[item.variantId].price || item.price;
//           item.original_price = variantDetails[item.variantId].original_price || item.original_price;
//           item.discount_amount = variantDetails[item.variantId].discount_amount || item.discount_amount;
//           item.images = variantDetails[item.variantId].images?.length
//             ? variantDetails[item.variantId].images
//             : item.images;
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length);

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             discount_amount,
//             stock,
//             images
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('product_id', productIds)
//           .eq('status', 'active')
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const cartItem = mergedCart.find(
//             (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//           );
//           const variants = variantData.filter((v) => v.product_id === product.id);

//           const parsedProduct = {
//             ...product,
//             price: parseFloat(product.price) || 0,
//             original_price: product.original_price ? parseFloat(product.original_price) : null,
//             discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: cartItem?.uniqueKey || `${product.id}-no-variant`,
//           };

//           if (cartItem?.selectedVariant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...cartItem.selectedVariant,
//                 price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                 original_price: cartItem.selectedVariant.original_price
//                   ? parseFloat(cartItem.selectedVariant.original_price)
//                   : parsedProduct.original_price,
//                 discount_amount: cartItem.selectedVariant.discount_amount
//                   ? parseFloat(cartItem.selectedVariant.discount_amount)
//                   : parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length
//                   ? cartItem.selectedVariant.images
//                   : parsedProduct.images,
//               },
//               price: cartItem.price || parsedProduct.price,
//               original_price: cartItem.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//               stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//               images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//           if (variant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...variant,
//                 price: parseFloat(variant.price) || parsedProduct.price,
//                 original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                 discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                 stock: variant.stock || parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//               },
//               price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//               original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//               stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//               images: variant.images?.length ? variant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = parsedProduct.images?.length
//             ? parsedProduct.images
//             : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//           return {
//             ...parsedProduct,
//             images: finalImages,
//             product_variants: variants.map((v) => ({
//               ...v,
//               price: parseFloat(v.price) || 0,
//               original_price: v.original_price ? parseFloat(v.original_price) : null,
//               discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//               stock: v.stock || 0,
//             })),
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart.'}`);
//       toast.error(`Failed to load cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     if (!cartId) {
//       console.warn('Cannot update cart item: cartId is undefined');
//       toast.error('Cannot update cart: Invalid cart ID.', { duration: 3000 });
//       return;
//     }
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw upsertError;
//     } catch (err) {
//       setError('Failed to sync cart with server.');
//       toast.error(`Failed to sync cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     if (!cartId) {
//       console.warn('Cannot delete cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return false;
//     }
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) throw deleteError;
//       return true;
//     } catch (err) {
//       setError('Failed to sync cart with server.');
//       toast.error(`Failed to sync cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Sync error:', err);
//       return false;
//     }
//   };

//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot remove cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     // Store current state for potential rollback
//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     // Update client-side state
//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => !(product.id === productId && product.selectedVariant?.id === variantId)));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const success = await removeFromSupabaseCart(session.user.id, cartId);
//       if (!success) {
//         // Revert client-side changes if Supabase deletion fails
//         setCartItems(previousCartItems);
//         setProducts(previousProducts);
//         localStorage.setItem('cart', JSON.stringify(previousCartItems));
//         setCartCount(previousCartItems.length);
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   const increaseQuantity = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot increase quantity: cartId is undefined');
//       toast.error('Cannot update quantity: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//     const cartItem = cartItems.find((item) => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Stock limit reached.', { duration: 3000 });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', { duration: 3000 });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: product.title || product.name,
//       });
//     }
//   };

//   const decreaseQuantity = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot decrease quantity: cartId is undefined');
//       toast.error('Cannot update quantity: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', { duration: 3000 });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: products.find((p) => p.id === productId && p.selectedVariant?.id === variantId)?.title || 'Unnamed Product',
//       });
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//               );
              
//               if (!cartItem || !cartItem.cartId) {
//                 console.warn("Missing or invalid cartItem for product:", product.id, product.selectedVariant?.id);
//                 return null;
//               }
              
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={cartItem?.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`}>
//                         {product.title || product.name || 'Unnamed Product'}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹
//                         {(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹
//                           {product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹
//                         {(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => decreaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display">{quantity}</span>
//                       <button
//                         onClick={() => increaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹
//                 {discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0); // Initialize cart count to 0 if not logged in
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items from Supabase
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw supabaseError;

//       console.log('Fetched cart items:', supabaseCart);

//       // Merge with local storage and sync unsynced items
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       // Process Supabase cart items first
//       supabaseCart.forEach((item) => {
//         if (item.id) {
//           const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: null, // Populated later
//             price: item.price || 0,
//             title: item.title || 'Unnamed Product',
//             images: [], // Populated later
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       });

//       // Sync local storage items to Supabase if not already present
//       for (const item of storedCart) {
//         if (item.id && item.uniqueKey && !productVariantSet.has(item.uniqueKey)) {
//           // Insert unsynced item into Supabase
//           const { data, error } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: item.id,
//               variant_id: item.variantId || null,
//               quantity: item.quantity || 1,
//               price: item.price || 0,
//               title: item.title || 'Unnamed Product',
//             })
//             .select('id')
//             .single();
//           if (error) {
//             console.error('Failed to sync local storage item:', error);
//             continue; // Skip item if sync fails
//           }

//           const key = item.uniqueKey;
//           mergedCart.push({
//             id: item.id,
//             cartId: data.id, // Use new Supabase ID
//             quantity: item.quantity || 1,
//             variantId: item.variantId || null,
//             selectedVariant: item.selectedVariant || null,
//             price: item.price || 0,
//             original_price: item.original_price || null,
//             discount_amount: item.discount_amount || 0,
//             title: item.title || 'Unnamed Product',
//             images: item.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       }

//       // Fetch variant details
//       const variantIds = mergedCart.filter((item) => item.variantId).map((item) => item.variantId);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds);
//         if (variantError) throw variantError;
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//             images: variant.images || [],
//           };
//           return acc;
//         }, {});
//       }

//       // Update mergedCart with variant details
//       mergedCart.forEach((item) => {
//         if (item.variantId && variantDetails[item.variantId]) {
//           item.selectedVariant = variantDetails[item.variantId];
//           item.price = variantDetails[item.variantId].price || item.price;
//           item.original_price = variantDetails[item.variantId].original_price || item.original_price;
//           item.discount_amount = variantDetails[item.variantId].discount_amount || item.discount_amount;
//           item.images = variantDetails[item.variantId].images?.length
//             ? variantDetails[item.variantId].images
//             : item.images;
//         }
//       });

//       setCartItems(mergedCart);
//       localStorage.setItem('cart', JSON.stringify(mergedCart));
//       setCartCount(mergedCart.length); // Update cart count

//       if (mergedCart.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       if (productIds.length === 0) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }

//       // Fetch products
//       const { data: productData, error: productError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select(`
//             id,
//             seller_id,
//             title,
//             name,
//             price,
//             original_price,
//             discount_amount,
//             stock,
//             images
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productError) throw productError;

//       // Fetch all variants for these products
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('product_id', productIds)
//           .eq('status', 'active')
//       );
//       if (variantError) throw variantError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);

//       // Fetch sellers for distance calculation
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       const validProducts = (productData || [])
//         .filter((product) => product.id && (product.title || product.name))
//         .map((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//             return null;
//           }

//           const cartItem = mergedCart.find(
//             (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//           );
//           const variants = variantData.filter((v) => v.product_id === product.id);

//           const parsedProduct = {
//             ...product,
//             price: parseFloat(product.price) || 0,
//             original_price: product.original_price ? parseFloat(product.original_price) : null,
//             discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: cartItem?.uniqueKey || `${product.id}-no-variant`,
//           };

//           if (cartItem?.selectedVariant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...cartItem.selectedVariant,
//                 price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                 original_price: cartItem.selectedVariant.original_price
//                   ? parseFloat(cartItem.selectedVariant.original_price)
//                   : parsedProduct.original_price,
//                 discount_amount: cartItem.selectedVariant.discount_amount
//                   ? parseFloat(cartItem.selectedVariant.discount_amount)
//                   : parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length
//                   ? cartItem.selectedVariant.images
//                   : parsedProduct.images,
//               },
//               price: cartItem.price || parsedProduct.price,
//               original_price: cartItem.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//               stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//               images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//           if (variant) {
//             return {
//               ...parsedProduct,
//               selectedVariant: {
//                 ...variant,
//                 price: parseFloat(variant.price) || parsedProduct.price,
//                 original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                 discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                 stock: variant.stock || parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//               },
//               price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//               original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//               discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//               stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//               images: variant.images?.length ? variant.images : parsedProduct.images,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           }

//           const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//           const finalImages = parsedProduct.images?.length
//             ? parsedProduct.images
//             : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//           return {
//             ...parsedProduct,
//             images: finalImages,
//             product_variants: variants.map((v) => ({
//               ...v,
//               price: parseFloat(v.price) || 0,
//               original_price: v.original_price ? parseFloat(v.original_price) : null,
//               discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//               stock: v.stock || 0,
//             })),
//           };
//         })
//         .filter((p) => p !== null);

//       setProducts(validProducts);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load cart.'}`);
//       toast.error(`Failed to load cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem) => {
//     if (!cartId) {
//       console.warn('Cannot update cart item: cartId is undefined');
//       toast.error('Cannot update cart: Invalid cart ID.', { duration: 3000 });
//       return;
//     }
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw upsertError;
//     } catch (err) {
//       setError('Failed to sync cart with server.');
//       toast.error(`Failed to sync cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Sync error:', err);
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     if (!cartId) {
//       console.warn('Cannot delete cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return false;
//     }
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) throw deleteError;
//       return true;
//     } catch (err) {
//       setError('Failed to sync cart with server.');
//       toast.error(`Failed to sync cart: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Sync error:', err);
//       return false;
//     }
//   };

//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot remove cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     // Store current state for potential rollback
//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     // Update client-side state
//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => !(product.id === productId && product.selectedVariant?.id === variantId)));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const success = await removeFromSupabaseCart(session.user.id, cartId);
//       if (!success) {
//         // Revert client-side changes if Supabase deletion fails
//         setCartItems(previousCartItems);
//         setProducts(previousProducts);
//         localStorage.setItem('cart', JSON.stringify(previousCartItems));
//         setCartCount(previousCartItems.length);
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   const increaseQuantity = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot increase quantity: cartId is undefined');
//       toast.error('Cannot update quantity: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//     const cartItem = cartItems.find((item) => item.cartId === cartId);
//     const currentQuantity = cartItem.quantity || 1;
//     const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//     if (currentQuantity >= stock) {
//       toast.error('Stock limit reached.', { duration: 3000 });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         return { ...item, quantity: currentQuantity + 1 };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', { duration: 3000 });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: product.title || product.name,
//       });
//     }
//   };

//   const decreaseQuantity = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot decrease quantity: cartId is undefined');
//       toast.error('Cannot update quantity: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const updatedCart = cartItems.map((item) => {
//       if (item.cartId === cartId) {
//         const newQty = (item.quantity || 1) - 1;
//         return { ...item, quantity: newQty < 1 ? 1 : newQty };
//       }
//       return item;
//     });
//     setCartItems(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);
//     toast.success('Cart updated!', { duration: 3000 });

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//       await updateSupabaseCartItem(session.user.id, cartId, productId, {
//         ...updatedItem,
//         title: products.find((p) => p.id === productId && p.selectedVariant?.id === variantId)?.title || 'Unnamed Product',
//       });
//     }
//   };

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // SEO variables
//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//               );
              
//               if (!cartItem || !cartItem.cartId) {
//                 console.warn("Missing or invalid cartItem for product:", product.id, product.selectedVariant?.id);
//                 return null;
//               }
              
//               const quantity = cartItem?.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               return (
//                 <div key={cartItem?.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${product.title || product.name} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`}>
//                         {product.title || product.name || 'Unnamed Product'}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹
//                         {(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹
//                           {product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹
//                         {(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => decreaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display">{quantity}</span>
//                       <button
//                         onClick={() => increaseQuantity(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem?.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹
//               {total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹
//                 {discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { supabase } from '../supabaseClient';
// import { Link } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { LocationContext } from '../App';
// import '../style/Cart.css';
// import Footer from './Footer';
// import { toast } from 'react-hot-toast';
// import { Helmet } from 'react-helmet-async';
// import debounce from 'lodash/debounce';

// // Custom retry function for Supabase requests (exponential backoff)
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message, error.details);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation function
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
//     return null;
//   }
//   const R = 6371;
//   const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(latDiff / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Get user session
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0);
//         setCartItems([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setLoading(false);
//         return;
//       }

//       const userId = session.user.id;

//       // Fetch cart items from Supabase
//       const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, quantity, variant_id, price, title')
//           .eq('user_id', userId)
//       );
//       if (supabaseError) throw new Error(`Failed to fetch cart items: ${supabaseError.message}`);

//       console.log('Supabase cart items:', supabaseCart);

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       // Process Supabase cart items
//       supabaseCart.forEach((item) => {
//         if (item.id && item.product_id) {
//           const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
//           mergedCart.push({
//             id: item.product_id,
//             cartId: item.id,
//             quantity: item.quantity || 1,
//             variantId: item.variant_id || null,
//             selectedVariant: null,
//             price: parseFloat(item.price) || 0,
//             title: item.title || 'Unnamed Product',
//             images: [],
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       });

//       // Sync local storage items to Supabase
//       for (const item of storedCart) {
//         if (item.id && item.uniqueKey && !productVariantSet.has(item.uniqueKey) && item.cartId) {
//           const { data, error } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: item.id,
//               variant_id: item.variantId || null,
//               quantity: item.quantity || 1,
//               price: item.price || 0,
//               title: item.title || 'Unnamed Product',
//             })
//             .select('id')
//             .single();
//           if (error) {
//             console.error('Failed to sync local storage item:', item.uniqueKey, error);
//             continue;
//           }

//           const key = item.uniqueKey;
//           mergedCart.push({
//             id: item.id,
//             cartId: data.id,
//             quantity: item.quantity || 1,
//             variantId: item.variantId || null,
//             selectedVariant: item.selectedVariant || null,
//             price: parseFloat(item.price) || 0,
//             original_price: item.original_price || null,
//             discount_amount: item.discount_amount || 0,
//             title: item.title || 'Unnamed Product',
//             images: item.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//             uniqueKey: key,
//           });
//           productVariantSet.add(key);
//         }
//       }

//       // Fetch variant details
//       const variantIds = mergedCart.filter((item) => item.variantId).map((item) => item.variantId);
//       let variantDetails = {};
//       if (variantIds.length > 0) {
//         const { data: variantData, error: variantError } = await supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//           .in('id', variantIds)
//           .eq('status', 'active');
//         if (variantError) throw new Error(`Failed to fetch variant details: ${variantError.message}`);
//         variantDetails = variantData.reduce((acc, variant) => {
//           acc[variant.id] = {
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//             discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//             stock: variant.stock || 0,
//             images: variant.images || [],
//           };
//           return acc;
//         }, {});
//       }

//       // Update mergedCart with variant details
//       mergedCart.forEach((item) => {
//         if (item.variantId && variantDetails[item.variantId]) {
//           item.selectedVariant = variantDetails[item.variantId];
//           item.price = variantDetails[item.variantId].price || item.price;
//           item.original_price = variantDetails[item.variantId].original_price || item.original_price;
//           item.discount_amount = variantDetails[item.variantId].discount_amount || item.discount_amount;
//           item.images = variantDetails[item.variantId].images?.length
//             ? variantDetails[item.variantId].images
//             : item.images;
//         }
//       });

//       // Fetch products
//       const productIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       let validProducts = [];
//       if (productIds.length > 0) {
//         const { data: productData, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select(`
//               id,
//               seller_id,
//               title,
//               name,
//               price,
//               original_price,
//               discount_amount,
//               stock,
//               images
//             `)
//             .in('id', productIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         );
//         if (productError) throw new Error(`Failed to fetch products: ${productError.message}`);

//         // Fetch all variants for these products
//         const { data: variantData, error: variantError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//             .in('product_id', productIds)
//             .eq('status', 'active')
//         );
//         if (variantError) throw new Error(`Failed to fetch product variants: ${variantError.message}`);

//         // Fetch sellers for distance calculation
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);

//         validProducts = (productData || [])
//           .filter((product) => product.id && (product.title || product.name))
//           .map((product) => {
//             const seller = sellersData.find((s) => s.id === product.seller_id);
//             if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//               return null;
//             }

//             const cartItem = mergedCart.find(
//               (item) => item.id === product.id && item.variantId === (variantData.find((v) => v.id === item.variantId)?.id || null)
//             );
//             const variants = variantData.filter((v) => v.product_id === product.id);

//             const parsedProduct = {
//               ...product,
//               price: parseFloat(product.price) || 0,
//               original_price: product.original_price ? parseFloat(product.original_price) : null,
//               discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//               stock: product.stock || 0,
//               images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
//               uniqueKey: cartItem?.uniqueKey || `${product.id}-no-variant`,
//             };

//             if (cartItem?.selectedVariant) {
//               return {
//                 ...parsedProduct,
//                 selectedVariant: {
//                   ...cartItem.selectedVariant,
//                   price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
//                   original_price: cartItem.selectedVariant.original_price
//                     ? parseFloat(cartItem.selectedVariant.original_price)
//                     : parsedProduct.original_price,
//                   discount_amount: cartItem.selectedVariant.discount_amount
//                     ? parseFloat(cartItem.selectedVariant.discount_amount)
//                     : parsedProduct.discount_amount,
//                   stock: cartItem.selectedVariant.stock || parsedProduct.stock,
//                   images: cartItem.selectedVariant.images?.length
//                     ? cartItem.selectedVariant.images
//                     : parsedProduct.images,
//                 },
//                 price: cartItem.price || parsedProduct.price,
//                 original_price: cartItem.original_price || parsedProduct.original_price,
//                 discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
//                 stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
//                 images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
//                 product_variants: variants.map((v) => ({
//                   ...v,
//                   price: parseFloat(v.price) || 0,
//                   original_price: v.original_price ? parseFloat(v.original_price) : null,
//                   discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                   stock: v.stock || 0,
//                 })),
//               };
//             }

//             const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
//             if (variant) {
//               return {
//                 ...parsedProduct,
//                 selectedVariant: {
//                   ...variant,
//                   price: parseFloat(variant.price) || parsedProduct.price,
//                   original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
//                   discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
//                   stock: variant.stock || parsedProduct.stock,
//                   images: variant.images?.length ? variant.images : parsedProduct.images,
//                 },
//                 price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
//                 original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
//                 discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
//                 stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
//                 images: variant.images?.length ? variant.images : parsedProduct.images,
//                 product_variants: variants.map((v) => ({
//                   ...v,
//                   price: parseFloat(v.price) || 0,
//                   original_price: v.original_price ? parseFloat(v.original_price) : null,
//                   discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                   stock: v.stock || 0,
//                 })),
//               };
//             }

//             const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
//             const finalImages = parsedProduct.images?.length
//               ? parsedProduct.images
//               : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
//             return {
//               ...parsedProduct,
//               images: finalImages,
//               product_variants: variants.map((v) => ({
//                 ...v,
//                 price: parseFloat(v.price) || 0,
//                 original_price: v.original_price ? parseFloat(v.original_price) : null,
//                 discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
//                 stock: v.stock || 0,
//               })),
//             };
//           })
//           .filter((p) => p !== null);

//         // Clean up invalid cart items
//         const validCartItems = mergedCart.filter((item) =>
//           validProducts.some((p) => p.id === item.id && p.uniqueKey === item.uniqueKey)
//         );

//         // Remove invalid cart items from Supabase
//         const invalidCartIds = mergedCart
//           .filter((item) => !validCartItems.includes(item))
//           .map((item) => item.cartId);
//         if (invalidCartIds.length > 0) {
//           const { error: deleteError } = await supabase
//             .from('cart')
//             .delete()
//             .eq('user_id', userId)
//             .in('id', invalidCartIds);
//           if (deleteError) {
//             console.error('Failed to clean up invalid cart items in Supabase:', deleteError);
//           } else {
//             console.log('Cleaned up invalid cart items from Supabase:', invalidCartIds);
//           }
//         }

//         // Update state
//         console.log('Valid cart items:', validCartItems);
//         console.log('Valid products:', validProducts);
//         setCartItems(validCartItems);
//         localStorage.setItem('cart', JSON.stringify(validCartItems));
//         setCartCount(validCartItems.length);
//         setProducts(validCartItems.length > 0 ? validProducts : []);
//       } else {
//         setCartItems([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         setCartCount(0);
//         setProducts([]);
//       }
//     } catch (err) {
//       const errorMessage = err.message || 'Failed to load cart.';
//       setError(`Error: ${errorMessage}`);
//       toast.error(`Failed to load cart: ${errorMessage}`, { duration: 3000 });
//       console.error('Cart fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   useEffect(() => {
//     if (!buyerLocation || typeof fetchCartItems !== 'function') return;
//     fetchCartItems();
//   }, [buyerLocation, fetchCartItems]);

//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
//     if (!cartId) {
//       console.warn(`Cannot update cart item (${operation}): cartId is undefined`);
//       toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
//       return false;
//     }
//     try {
//       const { error: upsertError } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .upsert(
//             {
//               id: cartId,
//               user_id: userId,
//               product_id: productId,
//               quantity: updatedItem.quantity || 1,
//               variant_id: updatedItem.variantId || null,
//               price: updatedItem.price || 0,
//               title: updatedItem.title || 'Unnamed Product',
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
//       return true;
//     } catch (err) {
//       setError(`Failed to sync cart with server during ${operation}.`);
//       toast.error(`Failed to ${operation} quantity: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error(`Sync error during ${operation}:`, err);
//       return false;
//     }
//   };

//   const removeFromSupabaseCart = async (userId, cartId) => {
//     if (!cartId) {
//       console.warn('Cannot delete cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return false;
//     }
//     try {
//       const { error: deleteError } = await retryRequest(() =>
//         supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
//       );
//       if (deleteError) throw new Error(`Failed to remove item: ${deleteError.message}`);
//       return true;
//     } catch (err) {
//       setError('Failed to sync cart with server during removal.');
//       toast.error(`Failed to remove item: ${err.message || 'Unknown error'}`, { duration: 3000 });
//       console.error('Sync error during removal:', err);
//       return false;
//     }
//   };

//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot remove cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//     setCartItems(updatedCart);
//     setProducts((prev) => prev.filter((product) => !(product.id === productId && product.selectedVariant?.id === variantId)));
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     setCartCount(updatedCart.length);

//     const { data: { session } } = await supabase.auth.getSession();
//     if (session?.user) {
//       const success = await removeFromSupabaseCart(session.user.id, cartId);
//       if (!success) {
//         setCartItems(previousCartItems);
//         setProducts(previousProducts);
//         localStorage.setItem('cart', JSON.stringify(previousCartItems));
//         setCartCount(previousCartItems.length);
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   // Debounced quantity update functions
//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (!cartId) {
//         console.warn('Cannot increase quantity: cartId is undefined');
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//       const cartItem = cartItems.find((item) => item.cartId === cartId);
//       if (!cartItem || !product) {
//         console.error('Item not found in cart:', { cartId, productId, variantId });
//         console.log('Current cartItems:', cartItems);
//         console.log('Current products:', products);
//         toast.error('Item not found in cart. Please refresh the page.', { duration: 3000 });
//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user && cartId) {
//           await removeFromSupabaseCart(session.user.id, cartId);
//           const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//           setCartItems(updatedCart);
//           localStorage.setItem('cart', JSON.stringify(updatedCart));
//           setCartCount(updatedCart.length);
//         }
//         return;
//       }

//       const currentQuantity = cartItem.quantity || 1;
//       const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//       if (currentQuantity >= stock) {
//         toast.error('Stock limit reached.', { duration: 3000 });
//         return;
//       }

//       const previousCartItems = [...cartItems];
//       const updatedCart = cartItems.map((item) =>
//         item.cartId === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//       );
//       setCartItems(updatedCart);
//       localStorage.setItem('cart', JSON.stringify(updatedCart));
//       toast.success('Cart updated!', { duration: 3000 });

//       const { data: { session } } = await supabase.auth.getSession();
//       if (session?.user) {
//         const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//         const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//           ...updatedItem,
//           title: product.title || product.name,
//         }, 'increase');
//         if (!success) {
//           setCartItems(previousCartItems);
//           localStorage.setItem('cart', JSON.stringify(previousCartItems));
//           return;
//         }
//       }
//     }, 300),
//     [cartItems, products]
//   );

//   const debouncedDecreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (!cartId) {
//         console.warn('Cannot decrease quantity: cartId is undefined');
//         toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       const cartItem = cartItems.find((item) => item.cartId === cartId);
//       const product = products.find((p) => p.id === productId && p.selectedVariant?.id === variantId);
//       if (!cartItem || !product) {
//         console.error('Item not found in cart:', { cartId, productId, variantId });
//         console.log('Current cartItems:', cartItems);
//         console.log('Current products:', products);
//         toast.error('Item not found in cart. Please refresh the page.', { duration: 3000 });
//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user && cartId) {
//           await removeFromSupabaseCart(session.user.id, cartId);
//           const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//           setCartItems(updatedCart);
//           localStorage.setItem('cart', JSON.stringify(updatedCart));
//           setCartCount(updatedCart.length);
//         }
//         return;
//       }

//       const currentQuantity = cartItem.quantity || 1;
//       if (currentQuantity <= 1) {
//         toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//         return;
//       }

//       const previousCartItems = [...cartItems];
//       const updatedCart = cartItems.map((item) =>
//         item.cartId === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//       );
//       setCartItems(updatedCart);
//       localStorage.setItem('cart', JSON.stringify(updatedCart));
//       toast.success('Cart updated!', { duration: 3000 });

//       const { data: { session } } = await supabase.auth.getSession();
//       if (session?.user) {
//         const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//         const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//           ...updatedItem,
//           title: product.title || product.name,
//         }, 'decrease');
//         if (!success) {
//           setCartItems(previousCartItems);
//           localStorage.setItem('cart', JSON.stringify(previousCartItems));
//           return;
//         }
//       }
//     }, 300),
//     [cartItems, products]
//   );

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(
//       (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//     );
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   const pageUrl = 'https://www.markeet.com/cart';

//   if (loading) return <div className="cart-loading">Loading...</div>;
//   if (error) return <div className="cart-error">{error}</div>;

//   return (
//     <div className="cart">
//       <Helmet>
//         <title>Shopping Cart - Markeet</title>
//         <meta
//           name="description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="keywords"
//           content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
//         />
//         <meta name="robots" content="noindex, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content="Shopping Cart - Markeet" />
//         <meta
//           property="og:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           property="og:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="Shopping Cart - Markeet" />
//         <meta
//           name="twitter:description"
//           content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
//         />
//         <meta
//           name="twitter:image"
//           content={
//             products[0]?.images?.[0] ||
//             'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//           }
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl,
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {cartItems.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(
//                 (item) => item.id === product.id && item.variantId === (product.selectedVariant?.id || null)
//               );
//               if (!cartItem || !cartItem.cartId) {
//                 console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               const productName = product.title || product.name || 'Unnamed Product';

//               return (
//                 <div key={cartItem.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={
//                       selectedVariant?.images?.[0] ||
//                       product.images?.[0] ||
//                       'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
//                     }
//                     alt={`${productName} cart image`}
//                     onError={(e) => {
//                       e.target.src =
//                         'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
//                         {productName}
//                       </Link>
//                       {selectedVariant && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes || {})
//                             .filter(([key, val]) => val && val.trim())
//                             .map(([key, val]) => `${key}: ${val}`)
//                             .join(', ')}
//                         </span>
//                       )}
//                     </h3>
//                     <div className="cart-item-price-section">
//                       <span className="cart-item-price">
//                         ₹{(product.price || 0).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => debouncedDecreaseQuantity(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1 || loading}
//                         aria-label={`Decrease quantity of ${productName}`}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
//                         {quantity}
//                       </span>
//                       <button
//                         onClick={() => debouncedIncreaseQuantity(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock || loading}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading}
//                       aria-label={`Remove ${productName} from cart`}
//                     >
//                       <FaTrash /> Remove
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="cart-total">
//             <h3>
//               Subtotal: ₹{total.toLocaleString('en-IN', {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn" aria-label="Proceed to checkout">
//               Proceed to Checkout
//             </Link>
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Cart;

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { LocationContext } from '../App';
import '../style/Cart.css';
import Footer from './Footer';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import debounce from 'lodash/debounce';

// Custom retry function for Supabase requests (exponential backoff)
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Distance calculation function
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
    return null;
  }
  const R = 6371;
  const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function for product matching
function matchProduct(p, productId, variantId) {
  const variantMatch = variantId ? p.selectedVariant?.id === variantId : !p.selectedVariant;
  return p.id === productId && variantMatch;
}

function Cart() {
  const { buyerLocation, setCartCount } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cleanup invalid cart items on mount
  const cleanupInvalidCartItems = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const { data: cartItems } = await retryRequest(() =>
        supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
      );

      if (!cartItems?.length) return;

      const productIds = [...new Set(cartItems.map((item) => item.product_id))];
      const { data: validProducts } = await retryRequest(() =>
        supabase
          .from('products')
          .select('id, seller_id')
          .in('id', productIds)
          .eq('is_approved', true)
          .eq('status', 'active')
      );

      const { data: sellersData } = await retryRequest(() =>
        supabase.from('sellers').select('id, latitude, longitude')
      );

      const validProductIds = new Set(
        validProducts.filter((p) => {
          const seller = sellersData.find((s) => s.id === p.seller_id);
          return seller && calculateDistance(buyerLocation, seller) <= 40;
        }).map((p) => p.id)
      );

      const variantIds = cartItems.filter((item) => item.variant_id).map((item) => item.variant_id);
      let validVariantIds = new Set();
      if (variantIds.length > 0) {
        const { data: validVariants } = await retryRequest(() =>
          supabase.from('product_variants').select('id, product_id').in('id', variantIds).eq('status', 'active')
        );
        validVariantIds = new Set(validVariants.filter((v) => validProductIds.has(v.product_id)).map((v) => v.id));
      }

      const invalidCartIds = cartItems
        .filter((item) => !validProductIds.has(item.product_id) || (item.variant_id && !validVariantIds.has(item.variant_id)))
        .map((item) => item.id);

      if (invalidCartIds.length > 0) {
        await retryRequest(() =>
          supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
        );
        console.log('Cleaned up invalid cart items:', invalidCartIds);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, [buyerLocation]);

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Please log in to view your cart.');
        setCartCount(0);
        setCartItems([]);
        localStorage.setItem('cart', JSON.stringify([]));
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch cart items from Supabase
      const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
        supabase
          .from('cart')
          .select('id, product_id, quantity, variant_id, price, title')
          .eq('user_id', userId)
      );
      if (supabaseError) throw new Error(`Failed to fetch cart items: ${supabaseError.message}`);

      // Validate cart items
      const productIds = [...new Set(supabaseCart.map((item) => item.product_id))];
      const { data: validProducts } = await retryRequest(() =>
        supabase
          .from('products')
          .select('id')
          .in('id', productIds)
          .eq('is_approved', true)
          .eq('status', 'active')
      );
      const validProductIds = new Set(validProducts.map((p) => p.id));

      const validSupabaseCart = supabaseCart.filter((item) => validProductIds.has(item.product_id));

      // Merge with local storage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      const mergedCart = [];
      const productVariantSet = new Set();

      validSupabaseCart.forEach((item) => {
        if (item.id && item.product_id) {
          const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
          mergedCart.push({
            id: item.product_id,
            cartId: item.id,
            quantity: item.quantity || 1,
            variantId: item.variant_id || null,
            selectedVariant: null,
            price: parseFloat(item.price) || 0,
            title: item.title || 'Unnamed Product',
            images: [],
            uniqueKey: key,
          });
          productVariantSet.add(key);
        }
      });

      // Sync local storage items to Supabase
      for (const item of storedCart) {
        if (item.id && item.uniqueKey && !productVariantSet.has(item.uniqueKey) && item.cartId) {
          const { data, error } = await retryRequest(() =>
            supabase
              .from('cart')
              .insert({
                user_id: userId,
                product_id: item.id,
                variant_id: item.variantId || null,
                quantity: item.quantity || 1,
                price: item.price || 0,
                title: item.title || 'Unnamed Product',
              })
              .select('id')
              .single()
          );
          if (error) {
            console.error('Failed to sync local storage item:', item.uniqueKey, error);
            continue;
          }

          const key = item.uniqueKey;
          mergedCart.push({
            id: item.id,
            cartId: data.id,
            quantity: item.quantity || 1,
            variantId: item.variantId || null,
            selectedVariant: item.selectedVariant || null,
            price: parseFloat(item.price) || 0,
            original_price: item.original_price || null,
            discount_amount: item.discount_amount || 0,
            title: item.title || 'Unnamed Product',
            images: item.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
            uniqueKey: key,
          });
          productVariantSet.add(key);
        }
      }

      // Fetch variant details
      const variantIds = mergedCart.filter((item) => item.variantId).map((item) => item.variantId);
      let variantDetails = {};
      if (variantIds.length > 0) {
        const { data: variantData, error: variantError } = await retryRequest(() =>
          supabase
            .from('product_variants')
            .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
            .in('id', variantIds)
            .eq('status', 'active')
        );
        if (variantError) throw new Error(`Failed to fetch variant details: ${variantError.message}`);
        variantDetails = variantData.reduce((acc, variant) => {
          acc[variant.id] = {
            ...variant,
            price: parseFloat(variant.price) || 0,
            original_price: variant.original_price ? parseFloat(variant.original_price) : null,
            discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
            stock: variant.stock || 0,
            images: variant.images || [],
          };
          return acc;
        }, {});
      }

      // Update mergedCart with variant details
      mergedCart.forEach((item) => {
        if (item.variantId && variantDetails[item.variantId]) {
          item.selectedVariant = variantDetails[item.variantId];
          item.price = variantDetails[item.variantId].price || item.price;
          item.original_price = variantDetails[item.variantId].original_price || item.original_price;
          item.discount_amount = variantDetails[item.variantId].discount_amount || item.discount_amount;
          item.images = variantDetails[item.variantId].images?.length
            ? variantDetails[item.variantId].images
            : item.images;
        }
      });

      // Fetch products
      const mergedProductIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
      let fetchedProducts = [];
      if (mergedProductIds.length > 0) {
        const { data: productData, error: productError } = await retryRequest(() =>
          supabase
            .from('products')
            .select(`
              id,
              seller_id,
              title,
              name,
              price,
              original_price,
              discount_amount,
              stock,
              images
            `)
            .in('id', mergedProductIds)
            .eq('is_approved', true)
            .eq('status', 'active')
        );
        if (productError) throw new Error(`Failed to fetch products: ${productError.message}`);

        const { data: variantData, error: variantError } = await retryRequest(() =>
          supabase
            .from('product_variants')
            .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
            .in('product_id', mergedProductIds)
            .eq('status', 'active')
        );
        if (variantError) throw new Error(`Failed to fetch product variants: ${variantError.message}`);

        const { data: sellersData, error: sellersError } = await retryRequest(() =>
          supabase.from('sellers').select('id, latitude, longitude')
        );
        if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);

        fetchedProducts = (productData || [])
          .filter((product) => {
            const seller = sellersData.find((s) => s.id === product.seller_id);
            if (!seller || calculateDistance(buyerLocation, seller) > 40) {
              console.warn(`Product ${product.id} filtered out: Seller not found or too far`);
              return false;
            }
            return product.id && (product.title || product.name);
          })
          .map((product) => {
            const cartItem = mergedCart.find((item) => matchProduct({ id: item.id, selectedVariant: item.selectedVariant }, product.id, item.variantId));
            const variants = variantData.filter((v) => v.product_id === product.id);

            const parsedProduct = {
              ...product,
              price: parseFloat(product.price) || 0,
              original_price: product.original_price ? parseFloat(product.original_price) : null,
              discount_amount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
              stock: product.stock || 0,
              images: product.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'],
              uniqueKey: cartItem?.uniqueKey || `${product.id}-no-variant`,
            };

            if (cartItem?.selectedVariant) {
              return {
                ...parsedProduct,
                selectedVariant: {
                  ...cartItem.selectedVariant,
                  price: parseFloat(cartItem.selectedVariant.price) || parsedProduct.price,
                  original_price: cartItem.selectedVariant.original_price
                    ? parseFloat(cartItem.selectedVariant.original_price)
                    : parsedProduct.original_price,
                  discount_amount: cartItem.selectedVariant.discount_amount
                    ? parseFloat(cartItem.selectedVariant.discount_amount)
                    : parsedProduct.discount_amount,
                  stock: cartItem.selectedVariant.stock || parsedProduct.stock,
                  images: cartItem.selectedVariant.images?.length
                    ? cartItem.selectedVariant.images
                    : parsedProduct.images,
                },
                price: cartItem.price || parsedProduct.price,
                original_price: cartItem.original_price || parsedProduct.original_price,
                discount_amount: cartItem.discount_amount || parsedProduct.discount_amount,
                stock: cartItem.selectedVariant.stock !== undefined ? cartItem.selectedVariant.stock : parsedProduct.stock,
                images: cartItem.selectedVariant.images?.length ? cartItem.selectedVariant.images : parsedProduct.images,
                product_variants: variants.map((v) => ({
                  ...v,
                  price: parseFloat(v.price) || 0,
                  original_price: v.original_price ? parseFloat(v.original_price) : null,
                  discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
                  stock: v.stock || 0,
                })),
              };
            }

            const variant = cartItem?.variantId ? variants.find((v) => v.id === cartItem.variantId) : null;
            if (variant) {
              return {
                ...parsedProduct,
                selectedVariant: {
                  ...variant,
                  price: parseFloat(variant.price) || parsedProduct.price,
                  original_price: variant.original_price ? parseFloat(variant.original_price) : parsedProduct.original_price,
                  discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : parsedProduct.discount_amount,
                  stock: variant.stock || parsedProduct.stock,
                  images: variant.images?.length ? variant.images : parsedProduct.images,
                },
                price: cartItem.price || parseFloat(variant.price) || parsedProduct.price,
                original_price: cartItem.original_price || variant.original_price || parsedProduct.original_price,
                discount_amount: cartItem.discount_amount || variant.discount_amount || parsedProduct.discount_amount,
                stock: variant.stock !== undefined ? variant.stock : parsedProduct.stock,
                images: variant.images?.length ? variant.images : parsedProduct.images,
                product_variants: variants.map((v) => ({
                  ...v,
                  price: parseFloat(v.price) || 0,
                  original_price: v.original_price ? parseFloat(v.original_price) : null,
                  discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
                  stock: v.stock || 0,
                })),
              };
            }

            const variantWithImages = variants.find((v) => Array.isArray(v.images) && v.images.length > 0);
            const finalImages = parsedProduct.images?.length
              ? parsedProduct.images
              : variantWithImages?.images || ['https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'];
            return {
              ...parsedProduct,
              images: finalImages,
              product_variants: variants.map((v) => ({
                ...v,
                price: parseFloat(v.price) || 0,
                original_price: v.original_price ? parseFloat(v.original_price) : null,
                discount_amount: v.discount_amount ? parseFloat(v.discount_amount) : 0,
                stock: v.stock || 0,
              })),
            };
          });

        const validCartItems = mergedCart.filter((item) =>
          fetchedProducts.some((p) => matchProduct(p, item.id, item.variantId))
        );

        const invalidCartIds = mergedCart
          .filter((item) => !validCartItems.includes(item))
          .map((item) => item.cartId);
        if (invalidCartIds.length > 0) {
          await retryRequest(() =>
            supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
          );
          console.log('Cleaned up invalid cart items:', invalidCartIds);
        }

        console.log('Valid cart items:', validCartItems);
        console.log('Valid products:', fetchedProducts);
        setCartItems(validCartItems);
        localStorage.setItem('cart', JSON.stringify(validCartItems));
        setCartCount(validCartItems.length);
        setProducts(validCartItems.length > 0 ? fetchedProducts : []);
      } else {
        setCartItems([]);
        localStorage.setItem('cart', JSON.stringify([]));
        setCartCount(0);
        setProducts([]);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load cart.';
      setError(`Error: ${errorMessage}`);
      toast.error(`Failed to load cart: ${errorMessage}`, { duration: 3000 });
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [buyerLocation, setCartCount]);

  useEffect(() => {
    if (!buyerLocation) return;
    cleanupInvalidCartItems().then(fetchCartItems);
  }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

  const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
    if (!cartId) {
      console.warn(`Cannot update cart item (${operation}): cartId is undefined`);
      toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
      return false;
    }
    try {
      const { error: upsertError } = await retryRequest(() =>
        supabase
          .from('cart')
          .upsert(
            {
              id: cartId,
              user_id: userId,
              product_id: productId,
              quantity: updatedItem.quantity || 1,
              variant_id: updatedItem.variantId || null,
              price: updatedItem.price || 0,
              title: updatedItem.title || 'Unnamed Product',
            },
            { onConflict: ['id'] }
          )
      );
      if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
      return true;
    } catch (err) {
      console.error(`Sync error during ${operation}:`, err);
      return false;
    }
  };

  const removeFromSupabaseCart = async (userId, cartId) => {
    if (!cartId) {
      console.warn('Cannot delete cart item: cartId is undefined');
      toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
      return false;
    }
    try {
      const { error: deleteError } = await retryRequest(() =>
        supabase.from('cart').delete().eq('id', cartId).eq('user_id', userId)
      );
      if (deleteError) throw new Error(`Failed to remove item: ${deleteError.message}`);
      return true;
    } catch (err) {
      console.error('Sync error during removal:', err);
      return false;
    }
  };

  const removeFromCart = async (cartId, productId, variantId) => {
    if (!cartId) {
      console.warn('Cannot remove cart item: cartId is undefined');
      toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
      return;
    }

    const previousCartItems = [...cartItems];
    const previousProducts = [...products];

    const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
    setCartItems(updatedCart);
    setProducts((prev) => prev.filter((product) => !matchProduct(product, productId, variantId)));
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const success = await removeFromSupabaseCart(session.user.id, cartId);
      if (!success) {
        setCartItems(previousCartItems);
        setProducts(previousProducts);
        localStorage.setItem('cart', JSON.stringify(previousCartItems));
        setCartCount(previousCartItems.length);
        toast.error('Failed to remove item from server.', { duration: 3000 });
        return;
      }
    }

    toast.success('Item removed from cart!', { duration: 3000 });
  };

  const debouncedIncreaseQuantity = useCallback(
    debounce(async (cartId, productId, variantId) => {
      if (!cartId) {
        console.warn('Cannot increase quantity: cartId is undefined');
        toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
        return;
      }

      setIsUpdating(true);
      try {
        console.log('Increasing quantity:', { cartId, productId, variantId });
        const cartItem = cartItems.find((item) => item.cartId === cartId);
        const product = products.find((p) => matchProduct(p, productId, variantId));
        if (!cartItem || !product) {
          console.error('Item not found in cart:', { cartId, productId, variantId });
          console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
          console.log('Current products:', JSON.stringify(products, null, 2));
          toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && cartId) {
            const success = await removeFromSupabaseCart(session.user.id, cartId);
            if (success) {
              const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
              setCartItems(updatedCart);
              localStorage.setItem('cart', JSON.stringify(updatedCart));
              setCartCount(updatedCart.length);
              setProducts((prev) => prev.filter((p) => !matchProduct(p, productId, variantId)));
            }
          }
          return;
        }

        const currentQuantity = cartItem.quantity || 1;
        const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

        if (currentQuantity >= stock) {
          toast.error('Stock limit reached.', { duration: 3000 });
          return;
        }

        const previousCartItems = [...cartItems];
        const updatedCart = cartItems.map((item) =>
          item.cartId === cartId ? { ...item, quantity: currentQuantity + 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCartCount(updatedCart.length);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const updatedItem = updatedCart.find((item) => item.cartId === cartId);
          const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
            ...updatedItem,
            title: product.title || product.name,
          }, 'increase');
          if (!success) {
            setCartItems(previousCartItems);
            localStorage.setItem('cart', JSON.stringify(previousCartItems));
            setCartCount(previousCartItems.length);
            toast.error('Failed to update cart on server.', { duration: 3000 });
            return;
          }
        }

        toast.success('Cart updated!', { duration: 3000 });
      } finally {
        setIsUpdating(false);
      }
    }, 300),
    [cartItems, products]
  );

  const debouncedDecreaseQuantity = useCallback(
    debounce(async (cartId, productId, variantId) => {
      if (!cartId) {
        console.warn('Cannot decrease quantity: cartId is undefined');
        toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
        return;
      }

      setIsUpdating(true);
      try {
        console.log('Decreasing quantity:', { cartId, productId, variantId });
        const cartItem = cartItems.find((item) => item.cartId === cartId);
        const product = products.find((p) => matchProduct(p, productId, variantId));
        if (!cartItem || !product) {
          console.error('Item not found in cart:', { cartId, productId, variantId });
          console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
          console.log('Current products:', JSON.stringify(products, null, 2));
          toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && cartId) {
            const success = await removeFromSupabaseCart(session.user.id, cartId);
            if (success) {
              const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
              setCartItems(updatedCart);
              localStorage.setItem('cart', JSON.stringify(updatedCart));
              setCartCount(updatedCart.length);
              setProducts((prev) => prev.filter((p) => !matchProduct(p, productId, variantId)));
            }
          }
          return;
        }

        const currentQuantity = cartItem.quantity || 1;
        if (currentQuantity <= 1) {
          toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
          return;
        }

        const previousCartItems = [...cartItems];
        const updatedCart = cartItems.map((item) =>
          item.cartId === cartId ? { ...item, quantity: currentQuantity - 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCartCount(updatedCart.length);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const updatedItem = updatedCart.find((item) => item.cartId === cartId);
          const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
            ...updatedItem,
            title: product.title || product.name,
          }, 'decrease');
          if (!success) {
            setCartItems(previousCartItems);
            localStorage.setItem('cart', JSON.stringify(previousCartItems));
            setCartCount(previousCartItems.length);
            toast.error('Failed to update cart on server.', { duration: 3000 });
            return;
          }
        }

        toast.success('Cart updated!', { duration: 3000 });
      } finally {
        setIsUpdating(false);
      }
    }, 300),
    [cartItems, products]
  );

  const total = products.reduce((sum, product) => {
    const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
    const quantity = cartItem?.quantity || 1;
    const price = product.price || 0;
    return sum + price * quantity;
  }, 0);

  const discountTotal = products.reduce((sum, product) => {
    const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
    const quantity = cartItem?.quantity || 1;
    const discount = product.discount_amount || 0;
    return sum + discount * quantity;
  }, 0);

  const pageUrl = 'https://www.markeet.com/cart';

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error">{error}</div>;

  return (
    <div className="cart">
      <Helmet>
        <title>Shopping Cart - Markeet</title>
        <meta
          name="description"
          content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
        />
        <meta
          name="keywords"
          content="cart, shopping cart, ecommerce, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet"
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Shopping Cart - Markeet" />
        <meta
          property="og:description"
          content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
        />
        <meta
          property="og:image"
          content={
            products[0]?.images?.[0] ||
            'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
          }
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shopping Cart - Markeet" />
        <meta
          name="twitter:description"
          content="View and manage your shopping cart on Markeet. Proceed to checkout for electronics, appliances, fashion, and more."
        />
        <meta
          name="twitter:image"
          content={
            products[0]?.images?.[0] ||
            'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
          }
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Shopping Cart - Markeet',
            description: 'View and manage your shopping cart on Markeet.',
            url: pageUrl,
          })}
        </script>
      </Helmet>
      <h1 className="cart-title">FreshCart Cart</h1>
      {cartItems.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {products.map((product, index) => {
              const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
              if (!cartItem || !cartItem.cartId) {
                console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
                return null;
              }

              const quantity = cartItem.quantity || 1;
              const selectedVariant = product.selectedVariant;
              const productName = product.title || product.name || 'Unnamed Product';

              return (
                <div key={cartItem.uniqueKey || `${product.id}-${index}`} className="cart-item">
                  <img
                    src={
                      selectedVariant?.images?.[0] ||
                      product.images?.[0] ||
                      'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                    }
                    alt={`${productName} cart image`}
                    onError={(e) => {
                      e.target.src =
                        'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    }}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">
                      <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
                        {productName}
                      </Link>
                      {selectedVariant && (
                        <span className="variant-info">
                          {' '}
                          -{' '}
                          {Object.entries(selectedVariant.attributes || {})
                            .filter(([key, val]) => val && val.trim())
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ')}
                        </span>
                      )}
                    </h3>
                    <div className="cart-item-price-section">
                      <span className="cart-item-price">
                        ₹{(product.price || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="cart-item-original-price">
                          ₹{product.original_price.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                    {product.discount_amount > 0 && (
                      <p className="cart-item-discount">
                        Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                    <p className="cart-item-stock">
                      {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
                    </p>
                    <div className="cart-quantity">
                      <button
                        onClick={() => debouncedDecreaseQuantity(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
                        className="qty-btn"
                        disabled={quantity <= 1 || loading || isUpdating}
                        aria-label={`Decrease quantity of ${productName}`}
                      >
                        -
                      </button>
                      <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => debouncedIncreaseQuantity(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
                        className="qty-btn"
                        disabled={quantity >= product.stock || loading || isUpdating}
                        aria-label={`Increase quantity of ${productName}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
                      className="remove-btn"
                      disabled={loading || isUpdating}
                      aria-label={`Remove ${productName} from cart`}
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-total">
            <h3>
              Subtotal: ₹{total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            {discountTotal > 0 && (
              <p className="cart-total-discount">
                Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
            <Link to="/checkout" className="checkout-btn" aria-label="Proceed to checkout">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
      <Footer />
    </div>
  );
}

export default Cart;