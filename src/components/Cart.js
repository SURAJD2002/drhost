
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



import React, { useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { LocationContext } from '../App';
import '../style/Cart.css';

// Custom retry function for Supabase requests (exponential backoff)
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

// Distance calculation function
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
  const R = 6371; // Earth's radius in kilometers
  const latDiff = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const lonDiff = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) *
    Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
    Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Cart({ setCartCount }) {
  console.log('Cart.js: Rendering');
  const { buyerLocation } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError('Authentication required. Please ensure you are logged in.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Remove selected_variant from the query
      const { data: supabaseCart, error: supabaseError } = await retryRequest(() =>
        supabase.from('cart').select('product_id, quantity').eq('user_id', userId)
      );
      if (supabaseError) throw supabaseError;

      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];

      const mergedCart = [];
      const productIdsSet = new Set();

      storedCart.forEach(item => {
        if (item.id) {
          mergedCart.push({
            id: item.id,
            quantity: item.quantity || 1,
            selectedVariant: item.selectedVariant || null,
          });
          productIdsSet.add(item.id);
        }
      });

      supabaseCart.forEach(item => {
        if (!productIdsSet.has(item.product_id)) {
          mergedCart.push({
            id: item.product_id,
            quantity: item.quantity || 1,
            selectedVariant: null, // No selected_variant from Supabase
          });
          productIdsSet.add(item.product_id);
        }
      });

      setCartItems(mergedCart);
      localStorage.setItem('cart', JSON.stringify(mergedCart));
      setCartCount(mergedCart.length);

      if (mergedCart.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = mergedCart.map((item) => item.id).filter(Boolean);
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data: productData, error: fetchError } = await retryRequest(() =>
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
      if (fetchError) throw fetchError;

      const { data: sellersData, error: sellersError } = await retryRequest(() =>
        supabase.from('sellers').select('id, latitude, longitude')
      );
      if (sellersError) throw sellersError;

      const validProducts = (productData || [])
        .filter((product) => product.id && (product.title || product.name))
        .map((product) => {
          const seller = sellersData.find((s) => s.id === product.seller_id);
          if (!seller || calculateDistance(buyerLocation, seller) > 40) {
            return null;
          }

          const storedItem = mergedCart.find((item) => item.id === product.id);
          if (storedItem?.selectedVariant) {
            return {
              ...product,
              selectedVariant: storedItem.selectedVariant,
              price: storedItem.selectedVariant.price || product.price,
              images: storedItem.selectedVariant.images?.length
                ? storedItem.selectedVariant.images
                : product.images,
            };
          }

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
        })
        .filter((p) => p !== null);

      setProducts(validProducts);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError(`Error: ${err.message || 'Failed to load cart. Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  }, [buyerLocation, setCartCount]);

  useEffect(() => {
    if (!buyerLocation || typeof fetchCartItems !== 'function') return;
    fetchCartItems();
  }, [buyerLocation, fetchCartItems]);

  const updateSupabaseCart = async (userId, updatedCart) => {
    try {
      const { error: deleteError } = await retryRequest(() =>
        supabase.from('cart').delete().eq('user_id', userId)
      );
      if (deleteError) throw deleteError;

      if (updatedCart.length > 0) {
        const cartToInsert = updatedCart.map((item) => ({
          user_id: userId,
          product_id: item.id,
          quantity: item.quantity || 1,
          // Remove selected_variant from insert
        }));
        const { error: insertError } = await retryRequest(() =>
          supabase.from('cart').insert(cartToInsert)
        );
        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error updating Supabase cart:', err);
      setError('Failed to sync cart with server. Changes may not persist.');
    }
  };

  const removeFromCart = async (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    setMessage('Item removed from cart successfully!');

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await updateSupabaseCart(session.user.id, updatedCart);
    }
  };

  const increaseQuantity = async (productId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.id === productId) {
        return { ...item, quantity: (item.quantity || 1) + 1 };
      }
      return item;
    });
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    setMessage('Cart updated!');

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await updateSupabaseCart(session.user.id, updatedCart);
    }
  };

  const decreaseQuantity = async (productId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.id === productId) {
        const newQty = (item.quantity || 1) - 1;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    setMessage('Cart updated!');

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await updateSupabaseCart(session.user.id, updatedCart);
    }
  };

  const total = products.reduce((sum, product) => {
    const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
    return sum + (product.price || 0) * quantity;
  }, 0);

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error">{error}</div>;

  return (
    <div className="cart">
      <h1 className="cart-title">FreshCart Cart</h1>
      {message && <p className="cart-message">{message}</p>}
      {cartItems.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {products.map((product, index) => {
              const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 1;
              return (
                <div
                  key={`${product.id}-${index}`}
                  className="cart-item"
                >
                  <img
                    src={
                      product.images?.[0] ||
                      'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg'
                    }
                    alt={product.name || 'Product'}
                    onError={(e) => {
                      e.target.src =
                        'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';
                    }}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">
                      {product.title || product.name || 'Unnamed Product'}
                    </h3>
                    <p className="cart-item-price">
                      ₹
                      {product.price.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <div className="cart-quantity">
                      <button onClick={() => decreaseQuantity(product.id)} className="qty-btn">-</button>
                      <span className="qty-display">{quantity}</span>
                      <button onClick={() => increaseQuantity(product.id)} className="qty-btn">+</button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)} className="remove-btn">
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-total">
            <h3>
              Total: ₹
              {total.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <Link to="/checkout" className="checkout-btn">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}

      <div className="cart-footer">
        <div className="footer-icons">
          <span className="icon-circle">🏠</span>
          <span className="icon-circle">🛒</span>
        </div>
        <p className="footer-text">Categories</p>
      </div>
    </div>
  );
}

export default Cart;