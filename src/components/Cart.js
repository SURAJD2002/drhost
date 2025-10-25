



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
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
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

// // Helper function for product matching
// function matchProduct(p, productId, variantId) {
//   const variantMatch = variantId ? p.selectedVariant?.id === variantId : !p.selectedVariant;
//   return p.id === productId && variantMatch;
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Cleanup invalid cart items on mount
//   const cleanupInvalidCartItems = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) return;

//       const userId = session.user.id;
//       const { data: cartItems } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
//       );

//       if (!cartItems?.length) return;

//       const productIds = [...new Set(cartItems.map((item) => item.product_id))];
//       const { data: validProducts } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, seller_id')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );

//       const { data: sellersData } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );

//       const validProductIds = new Set(
//         validProducts.filter((p) => {
//           const seller = sellersData.find((s) => s.id === p.seller_id);
//           return seller && calculateDistance(buyerLocation, seller) <= 40;
//         }).map((p) => p.id)
//       );

//       const variantIds = cartItems.filter((item) => item.variant_id).map((item) => item.variant_id);
//       let validVariantIds = new Set();
//       if (variantIds.length > 0) {
//         const { data: validVariants } = await retryRequest(() =>
//           supabase.from('product_variants').select('id, product_id').in('id', variantIds).eq('status', 'active')
//         );
//         validVariantIds = new Set(validVariants.filter((v) => validProductIds.has(v.product_id)).map((v) => v.id));
//       }

//       const invalidCartIds = cartItems
//         .filter((item) => !validProductIds.has(item.product_id) || (item.variant_id && !validVariantIds.has(item.variant_id)))
//         .map((item) => item.id);

//       if (invalidCartIds.length > 0) {
//         await retryRequest(() =>
//           supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//         );
//         console.log('Cleaned up invalid cart items:', invalidCartIds);
//       }
//     } catch (err) {
//       console.error('Cleanup error:', err);
//     }
//   }, [buyerLocation]);

//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     try {
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

//       // Validate cart items
//       const productIds = [...new Set(supabaseCart.map((item) => item.product_id))];
//       const { data: validProducts } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       const validProductIds = new Set(validProducts.map((p) => p.id));

//       const validSupabaseCart = supabaseCart.filter((item) => validProductIds.has(item.product_id));

//       // Merge with local storage
//       const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//       const mergedCart = [];
//       const productVariantSet = new Set();

//       validSupabaseCart.forEach((item) => {
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
//           const { data, error } = await retryRequest(() =>
//             supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: item.id,
//                 variant_id: item.variantId || null,
//                 quantity: item.quantity || 1,
//                 price: item.price || 0,
//                 title: item.title || 'Unnamed Product',
//               })
//               .select('id')
//               .single()
//           );
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
//         const { data: variantData, error: variantError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         );
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
//       const mergedProductIds = [...new Set(mergedCart.map((item) => item.id).filter(Boolean))];
//       let fetchedProducts = [];
//       if (mergedProductIds.length > 0) {
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
//             .in('id', mergedProductIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         );
//         if (productError) throw new Error(`Failed to fetch products: ${productError.message}`);

//         const { data: variantData, error: variantError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, images, stock')
//             .in('product_id', mergedProductIds)
//             .eq('status', 'active')
//         );
//         if (variantError) throw new Error(`Failed to fetch product variants: ${variantError.message}`);

//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw new Error(`Failed to fetch sellers: ${sellersError.message}`);

//         fetchedProducts = (productData || [])
//           .filter((product) => {
//             const seller = sellersData.find((s) => s.id === product.seller_id);
//             if (!seller || calculateDistance(buyerLocation, seller) > 40) {
//               console.warn(`Product ${product.id} filtered out: Seller not found or too far`);
//               return false;
//             }
//             return product.id && (product.title || product.name);
//           })
//           .map((product) => {
//             const cartItem = mergedCart.find((item) => matchProduct({ id: item.id, selectedVariant: item.selectedVariant }, product.id, item.variantId));
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
//           });

//         const validCartItems = mergedCart.filter((item) =>
//           fetchedProducts.some((p) => matchProduct(p, item.id, item.variantId))
//         );

//         const invalidCartIds = mergedCart
//           .filter((item) => !validCartItems.includes(item))
//           .map((item) => item.cartId);
//         if (invalidCartIds.length > 0) {
//           await retryRequest(() =>
//             supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//           );
//           console.log('Cleaned up invalid cart items:', invalidCartIds);
//         }

//         console.log('Valid cart items:', validCartItems);
//         console.log('Valid products:', fetchedProducts);
//         setCartItems(validCartItems);
//         localStorage.setItem('cart', JSON.stringify(validCartItems));
//         setCartCount(validCartItems.length);
//         setProducts(validCartItems.length > 0 ? fetchedProducts : []);
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
//     if (!buyerLocation) return;
//     cleanupInvalidCartItems().then(fetchCartItems);
//   }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
//     setProducts((prev) => prev.filter((product) => !matchProduct(product, productId, variantId)));
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
//         toast.error('Failed to remove item from server.', { duration: 3000 });
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (!cartId) {
//         console.warn('Cannot increase quantity: cartId is undefined');
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         console.log('Increasing quantity:', { cartId, productId, variantId });
//         const cartItem = cartItems.find((item) => item.cartId === cartId);
//         const product = products.find((p) => matchProduct(p, productId, variantId));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts((prev) => prev.filter((p) => !matchProduct(p, productId, variantId)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         const stock = cartItem.selectedVariant ? cartItem.selectedVariant.stock : product.stock !== undefined ? product.stock : 0;

//         if (currentQuantity >= stock) {
//           toast.error('Stock limit reached.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map((item) =>
//           item.cartId === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title || product.name,
//           }, 'increase');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
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

//       setIsUpdating(true);
//       try {
//         console.log('Decreasing quantity:', { cartId, productId, variantId });
//         const cartItem = cartItems.find((item) => item.cartId === cartId);
//         const product = products.find((p) => matchProduct(p, productId, variantId));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter((item) => item.cartId !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts((prev) => prev.filter((p) => !matchProduct(p, productId, variantId)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         if (currentQuantity <= 1) {
//           toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map((item) =>
//           item.cartId === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find((item) => item.cartId === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title || product.name,
//           }, 'decrease');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products]
//   );

//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
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
//               const cartItem = cartItems.find((item) => matchProduct(product, item.id, item.variantId));
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
//                         disabled={quantity <= 1 || loading || isUpdating}
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
//                         disabled={quantity >= product.stock || loading || isUpdating}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.cartId, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading || isUpdating}
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

// // Default image URL
// const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// // Retry function with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise(res => setTimeout(res, delay));
//     }
//   }
// }

// // Haversine distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Unify product+variant matching
// function matchProduct(item, product) {
//   return item.id === product.id && (item.variantId || null) === (product.selectedVariant?.id || null);
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Cleanup out-of-range/invalid cart items
//   const cleanupInvalidCartItems = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) return;
//       const userId = session.user.id;
//       const { data: currentCart, error: cartError } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
//       );
//       if (cartError) throw new Error(`Cart fetch error: ${cartError.message}`);
//       if (!currentCart?.length) return;

//       const productIds = [...new Set(currentCart.map(i => i.product_id))];
//       const { data: validProducts, error: productsError } = await retryRequest(() =>
//         supabase.from('products').select('id, seller_id')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

//       const { data: sellers, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

//       const inRange = new Set(
//         validProducts.filter(p => {
//           const s = sellers.find(x => x.id === p.seller_id);
//           return s && calculateDistance(buyerLocation, s) <= 40;
//         }).map(p => p.id)
//       );

//       const variantIds = currentCart.filter(i => i.variant_id).map(i => i.variant_id);
//       let validVariants = new Set();
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantsError } = await retryRequest(() =>
//           supabase.from('product_variants').select('id, product_id')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         );
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
//         validVariants = new Set(variants.filter(v => inRange.has(v.product_id)).map(v => v.id));
//       }

//       const toDelete = currentCart
//         .filter(i => !inRange.has(i.product_id) || (i.variant_id && !validVariants.has(i.variant_id)))
//         .map(i => i.id);

//       if (toDelete.length) {
//         const { error: deleteError } = await retryRequest(() =>
//           supabase.from('cart').delete().in('id', toDelete).eq('user_id', userId)
//         );
//         if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
//         console.log('Cleaned up invalid cart items:', toDelete);
//       }
//     } catch (e) {
//       console.error('Cleanup failed:', e.message);
//       toast.error('Failed to clean up cart. Some items may not display.', { duration: 3000 });
//     }
//   }, [buyerLocation]);

//   // Fetch cart items and build display rows
//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0);
//         setCartItems([]);
//         setProducts([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }
//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId, 'Location:', buyerLocation);

//       // Load cart rows
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase.from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);
//       const validCart = rows || [];
//       setCartItems(validCart);
//       console.log('Cart rows:', validCart);

//       if (!validCart.length) {
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       const productIds = [...new Set(validCart.map(i => i.product_id))];
//       const variantIds = validCart.map(i => i.variant_id).filter(Boolean);

//       // Fetch product+variant+seller data
//       const [
//         { data: prods, error: prodErr },
//         { data: vars, error: varErr },
//         { data: sellers, error: sellErr }
//       ] = await Promise.all([
//         retryRequest(() =>
//           supabase.from('products')
//             .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id')
//             .in('id', productIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase.from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         )
//       ]);
//       if (prodErr) throw new Error(`Products fetch error: ${prodErr.message}`);
//       if (varErr) throw new Error(`Variants fetch error: ${varErr.message}`);
//       if (sellErr) throw new Error(`Sellers fetch error: ${sellErr.message}`);

//       console.log('Products:', prods);
//       console.log('Variants:', vars);
//       console.log('Sellers:', sellers);

//       // Filter products by seller distance
//       const validProducts = prods.filter(p => {
//         const s = sellers.find(x => x.id === p.seller_id);
//         if (!s || !buyerLocation?.lat || !buyerLocation?.lon) {
//           console.warn(`Skipping product ${p.id}: Invalid seller or buyer location`, { seller: s, buyerLocation });
//           return false;
//         }
//         return calculateDistance(buyerLocation, s) <= 40;
//       });

//       // Build display list (one row per variant)
//       const display = validCart
//         .map(item => {
//           const prod = validProducts.find(p => p.id === item.product_id);
//           if (!prod) {
//             console.warn(`Product not found for cart item: ${item.id}`, item);
//             return null;
//           }
//           const variant = vars.find(v => v.id === item.variant_id);
//           const images = Array.isArray(variant?.images) && variant.images.length > 0
//             ? variant.images
//             : Array.isArray(prod.images) && prod.images.length > 0
//               ? prod.images
//               : [defaultImage];

//           return {
//             cartId: item.id,
//             id: prod.id,
//             variantId: item.variant_id || null,
//             quantity: item.quantity || 1,
//             title: item.title || prod.title || prod.name || 'Unnamed Product',
//             selectedVariant: variant
//               ? {
//                   id: variant.id,
//                   attributes: variant.attributes || {},
//                   price: parseFloat(variant.price) || 0,
//                   original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                   discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                   stock: variant.stock || 0,
//                   images
//                 }
//               : null,
//             price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(prod.price) || 0,
//             original_price: variant
//               ? variant.original_price
//                 ? parseFloat(variant.original_price)
//                 : null
//               : prod.original_price
//                 ? parseFloat(prod.original_price)
//                 : null,
//             discount_amount: variant
//               ? variant.discount_amount
//                 ? parseFloat(variant.discount_amount)
//                 : 0
//               : prod.discount_amount
//                 ? parseFloat(prod.discount_amount)
//                 : 0,
//             stock: variant ? variant.stock : prod.stock || 0,
//             images,
//             uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`
//           };
//         })
//         .filter(item => item !== null);

//       console.log('Display products:', display);
//       setProducts(display);
//       setCartCount(display.length);
//       localStorage.setItem('cart', JSON.stringify(validCart));

//       // Clean up invalid cart items
//       const invalidCartIds = validCart
//         .filter(item => !display.some(d => d.cartId === item.id))
//         .map(item => item.id);
//       if (invalidCartIds.length > 0) {
//         await retryRequest(() =>
//           supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//         );
//         console.log('Cleaned up invalid cart items:', invalidCartIds);
//       }
//     } catch (e) {
//       const errorMessage = e.message || 'Failed to load cart.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000 });
//       console.error('Cart fetch error:', e);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   // Update Supabase cart item
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
//               title: updatedItem.title || 'Unnamed Product'
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
//       return true;
//     } catch (err) {
//       console.error(`Sync error during ${operation}:`, err);
//       toast.error(`Failed to ${operation} quantity: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from Supabase
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
//       console.error('Sync error during removal:', err);
//       toast.error(`Failed to remove item: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from cart
//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot remove cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     const updatedCart = cartItems.filter(item => item.id !== cartId);
//     setCartItems(updatedCart);
//     setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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
//         toast.error('Failed to remove item from server.', { duration: 3000 });
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   // Increase quantity
//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         console.warn('Update in progress, ignoring increase request');
//         return;
//       }
//       if (!cartId) {
//         console.warn('Cannot increase quantity: cartId is undefined');
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         const stock = product.selectedVariant ? product.selectedVariant.stock : product.stock || 0;

//         if (currentQuantity >= stock) {
//           toast.error('Stock limit reached.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'increase');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating]
//   );

//   // Decrease quantity
//   const debouncedDecreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         console.warn('Update in progress, ignoring decrease request');
//         return;
//       }
//       if (!cartId) {
//         console.warn('Cannot decrease quantity: cartId is undefined');
//         toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         if (currentQuantity <= 1) {
//           toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'decrease');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating]
//   );

//   // Calculate totals
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // Run cleanup and fetch on mount or location change
//   useEffect(() => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     cleanupInvalidCartItems().then(fetchCartItems);
//   }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
//           content={products[0]?.images?.[0] || defaultImage}
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
//           content={products[0]?.images?.[0] || defaultImage}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {products.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               const productName = product.title || 'Unnamed Product';

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={product.images?.[0] || defaultImage}
//                     alt={`${productName} cart image`}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for ${productName}: ${product.images?.[0]}`);
//                       e.target.src = defaultImage;
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
//                         {productName}
//                       </Link>
//                       {selectedVariant && Object.keys(selectedVariant.attributes || {}).length > 0 && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes)
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
//                           maximumFractionDigits: 2
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => debouncedDecreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1 || loading || isUpdating}
//                         aria-label={`Decrease quantity of ${productName}`}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
//                         {quantity}
//                       </span>
//                       <button
//                         onClick={() => debouncedIncreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock || loading || isUpdating}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading || isUpdating}
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
//                 maximumFractionDigits: 2
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2
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

// // Default image URL
// const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// // Retry function with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
//       await new Promise(res => setTimeout(res, delay));
//     }
//   }
// }

// // Haversine distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Unify product+variant matching
// function matchProduct(item, product) {
//   return item.id === product.id && (item.variantId || null) === (product.selectedVariant?.id || null);
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Cleanup out-of-range/invalid cart items
//   const cleanupInvalidCartItems = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) return;
//       const userId = session.user.id;
//       const { data: currentCart, error: cartError } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
//       );
//       if (cartError) throw new Error(`Cart fetch error: ${cartError.message}`);
//       if (!currentCart?.length) return;

//       const productIds = [...new Set(currentCart.map(i => i.product_id))];
//       const { data: validProducts, error: productsError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

//       const { data: sellers, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

//       const inRange = new Set(
//         validProducts
//           .filter(p => {
//             const seller = sellers.find(x => x.id === p.seller_id);
//             if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) return false;
//             const distance = calculateDistance(buyerLocation, seller);
//             const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//             return distance !== null && distance <= effectiveRadius;
//           })
//           .map(p => p.id)
//       );

//       const variantIds = currentCart.filter(i => i.variant_id).map(i => i.variant_id);
//       let validVariants = new Set();
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantsError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         );
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
//         validVariants = new Set(variants.filter(v => inRange.has(v.product_id)).map(v => v.id));
//       }

//       const toDelete = currentCart
//         .filter(i => !inRange.has(i.product_id) || (i.variant_id && !validVariants.has(i.variant_id)))
//         .map(i => i.id);

//       if (toDelete.length) {
//         const { error: deleteError } = await retryRequest(() =>
//           supabase.from('cart').delete().in('id', toDelete).eq('user_id', userId)
//         );
//         if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
//         console.log('Cleaned up invalid cart items:', toDelete);
//       }
//     } catch (e) {
//       console.error('Cleanup failed:', e.message);
//       toast.error('Failed to clean up cart. Some items may not display.', { duration: 3000 });
//     }
//   }, [buyerLocation]);

//   // Fetch cart items and build display rows
//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0);
//         setCartItems([]);
//         setProducts([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }
//       const userId = session.user.id;
//       console.log('Fetching cart for user:', userId, 'Location:', buyerLocation);

//       // Load cart rows
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);
//       const validCart = rows || [];
//       setCartItems(validCart);
//       console.log('Cart rows:', validCart);

//       if (!validCart.length) {
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       const productIds = [...new Set(validCart.map(i => i.product_id))];
//       const variantIds = validCart.map(i => i.variant_id).filter(Boolean);

//       // Fetch product+variant+seller data
//       const [
//         { data: prods, error: prodErr },
//         { data: vars, error: varErr },
//         { data: sellers, error: sellErr }
//       ] = await Promise.all([
//         retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//             .in('id', productIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         )
//       ]);
//       if (prodErr) throw new Error(`Products fetch error: ${prodErr.message}`);
//       if (varErr) throw new Error(`Variants fetch error: ${varErr.message}`);
//       if (sellErr) throw new Error(`Sellers fetch error: ${sellErr.message}`);

//       console.log('Products:', prods);
//       console.log('Variants:', vars);
//       console.log('Sellers:', sellers);

//       // Filter products by seller distance and effective radius
//       const validProducts = prods.filter(p => {
//         const seller = sellers.find(x => x.id === p.seller_id);
//         if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) {
//           console.warn(`Skipping product ${p.id}: Invalid seller or buyer location`, { seller, buyerLocation });
//           return false;
//         }
//         const distance = calculateDistance(buyerLocation, seller);
//         const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//         return distance !== null && distance <= effectiveRadius;
//       });

//       // Build display list (one row per variant)
//       const display = validCart
//         .map(item => {
//           const prod = validProducts.find(p => p.id === item.product_id);
//           if (!prod) {
//             console.warn(`Product not found for cart item: ${item.id}`, item);
//             return null;
//           }
//           const variant = vars.find(v => v.id === item.variant_id);
//           const images = Array.isArray(variant?.images) && variant.images.length > 0
//             ? variant.images
//             : Array.isArray(prod.images) && prod.images.length > 0
//               ? prod.images
//               : [defaultImage];

//           return {
//             cartId: item.id,
//             id: prod.id,
//             variantId: item.variant_id || null,
//             quantity: item.quantity || 1,
//             title: item.title || prod.title || prod.name || 'Unnamed Product',
//             selectedVariant: variant
//               ? {
//                   id: variant.id,
//                   attributes: variant.attributes || {},
//                   price: parseFloat(variant.price) || 0,
//                   original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                   discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                   stock: variant.stock || 0,
//                   images
//                 }
//               : null,
//             price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(prod.price) || 0,
//             original_price: variant
//               ? variant.original_price
//                 ? parseFloat(variant.original_price)
//                 : null
//               : prod.original_price
//                 ? parseFloat(prod.original_price)
//                 : null,
//             discount_amount: variant
//               ? variant.discount_amount
//                 ? parseFloat(variant.discount_amount)
//                 : 0
//               : prod.discount_amount
//                 ? parseFloat(prod.discount_amount)
//                 : 0,
//             stock: variant ? variant.stock : prod.stock || 0,
//             images,
//             uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
//             seller_id: prod.seller_id,
//             deliveryRadius: prod.delivery_radius_km || prod.categories?.max_delivery_radius_km || 40
//           };
//         })
//         .filter(item => item !== null);

//       console.log('Display products:', display);
//       setProducts(display);
//       setCartCount(display.length);
//       localStorage.setItem('cart', JSON.stringify(validCart));

//       // Clean up invalid cart items
//       const invalidCartIds = validCart
//         .filter(item => !display.some(d => d.cartId === item.id))
//         .map(item => item.id);
//       if (invalidCartIds.length > 0) {
//         await retryRequest(() =>
//           supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//         );
//         console.log('Cleaned up invalid cart items:', invalidCartIds);
//       }
//     } catch (e) {
//       const errorMessage = e.message || 'Failed to load cart.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000 });
//       console.error('Cart fetch error:', e);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   // Update Supabase cart item
//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
//     if (!cartId) {
//       console.warn(`Cannot update cart item (${operation}): cartId is undefined`);
//       toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
//       return false;
//     }
//     try {
//       const product = products.find(p => p.cartId === cartId);
//       if (!product) {
//         console.error('Product not found for cart item:', cartId);
//         return false;
//       }
//       const seller = await supabase.from('sellers').select('id, latitude, longitude').eq('id', product.seller_id).single();
//       if (seller.error || !seller.data) {
//         console.error('Seller not found:', seller.error);
//         return false;
//       }
//       const distance = calculateDistance(buyerLocation, seller.data);
//       if (distance === null || distance > product.deliveryRadius) {
//         console.error(`Cannot ${operation}: Product out of delivery range.`);
//         toast.error('Product is not available in your area.', { duration: 3000 });
//         return false;
//       }

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
//               title: updatedItem.title || 'Unnamed Product'
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
//       return true;
//     } catch (err) {
//       console.error(`Sync error during ${operation}:`, err);
//       toast.error(`Failed to ${operation} quantity: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from Supabase
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
//       console.error('Sync error during removal:', err);
//       toast.error(`Failed to remove item: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from cart
//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       console.warn('Cannot remove cart item: cartId is undefined');
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     const updatedCart = cartItems.filter(item => item.id !== cartId);
//     setCartItems(updatedCart);
//     setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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
//         toast.error('Failed to remove item from server.', { duration: 3000 });
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   // Increase quantity
//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         console.warn('Update in progress, ignoring increase request');
//         return;
//       }
//       if (!cartId) {
//         console.warn('Cannot increase quantity: cartId is undefined');
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         const stock = product.selectedVariant ? product.selectedVariant.stock : product.stock || 0;

//         if (currentQuantity >= stock) {
//           toast.error('Stock limit reached.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'increase');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation]
//   );

//   // Decrease quantity
//   const debouncedDecreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         console.warn('Update in progress, ignoring decrease request');
//         return;
//       }
//       if (!cartId) {
//         console.warn('Cannot decrease quantity: cartId is undefined');
//         toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           console.error('Item not found in cart:', { cartId, productId, variantId });
//           console.log('Current cartItems:', JSON.stringify(cartItems, null, 2));
//           console.log('Current products:', JSON.stringify(products, null, 2));
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         if (currentQuantity <= 1) {
//           toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'decrease');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation]
//   );

//   // Calculate totals
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // Run cleanup and fetch on mount or location change
//   useEffect(() => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       setError('Location data unavailable. Please set your location.');
//       setLoading(false);
//       return;
//     }
//     cleanupInvalidCartItems().then(fetchCartItems);
//   }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
//           content={products[0]?.images?.[0] || defaultImage}
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
//           content={products[0]?.images?.[0] || defaultImage}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">FreshCart Cart</h1>
//       {products.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 console.warn('Skipping render for invalid cartItem:', product.id, product.selectedVariant?.id);
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               const productName = product.title || 'Unnamed Product';

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={product.images?.[0] || defaultImage}
//                     alt={`${productName} cart image`}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for ${productName}: ${product.images?.[0]}`);
//                       e.target.src = defaultImage;
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
//                         {productName}
//                       </Link>
//                       {selectedVariant && Object.keys(selectedVariant.attributes || {}).length > 0 && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes)
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
//                           maximumFractionDigits: 2
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => debouncedDecreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1 || loading || isUpdating}
//                         aria-label={`Decrease quantity of ${productName}`}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
//                         {quantity}
//                       </span>
//                       <button
//                         onClick={() => debouncedIncreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock || loading || isUpdating}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading || isUpdating}
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
//                 maximumFractionDigits: 2
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2
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
// import icon from '../assets/icon.png';

// // Default image URL
// const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// // Retry function with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       await new Promise(res => setTimeout(res, delay));
//     }
//   }
// }

// // Haversine distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Unify product+variant matching
// function matchProduct(item, product) {
//   return item.id === product.id && (item.variantId || null) === (product.selectedVariant?.id || null);
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Cleanup out-of-range/invalid cart items
//   const cleanupInvalidCartItems = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) return;
//       const userId = session.user.id;
//       const { data: currentCart, error: cartError } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
//       );
//       if (cartError) throw new Error(`Cart fetch error: ${cartError.message}`);
//       if (!currentCart?.length) return;

//       const productIds = [...new Set(currentCart.map(i => i.product_id))];
//       const { data: validProducts, error: productsError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

//       const { data: sellers, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

//       const inRange = new Set(
//         validProducts
//           .filter(p => {
//             const seller = sellers.find(x => x.id === p.seller_id);
//             if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) return false;
//             const distance = calculateDistance(buyerLocation, seller);
//             const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//             return distance !== null && distance <= effectiveRadius;
//           })
//           .map(p => p.id)
//       );

//       const variantIds = currentCart.filter(i => i.variant_id).map(i => i.variant_id);
//       let validVariants = new Set();
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantsError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         );
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
//         validVariants = new Set(variants.filter(v => inRange.has(v.product_id)).map(v => v.id));
//       }

//       const toDelete = currentCart
//         .filter(i => !inRange.has(i.product_id) || (i.variant_id && !validVariants.has(i.variant_id)))
//         .map(i => i.id);

//       if (toDelete.length) {
//         const { error: deleteError } = await retryRequest(() =>
//           supabase.from('cart').delete().in('id', toDelete).eq('user_id', userId)
//         );
//         if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
//       }
//     } catch (e) {
//       toast.error('Failed to clean up cart. Some items may not display.', { duration: 3000 });
//     }
//   }, [buyerLocation]);

//   // Fetch cart items and build display rows
//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0);
//         setCartItems([]);
//         setProducts([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }
//       const userId = session.user.id;

//       // Load cart rows
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);
//       const validCart = rows || [];
//       setCartItems(validCart);

//       if (!validCart.length) {
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       const productIds = [...new Set(validCart.map(i => i.product_id))];
//       const variantIds = validCart.map(i => i.variant_id).filter(Boolean);

//       // Fetch product+variant+seller data
//       const [
//         { data: prods, error: prodErr },
//         { data: vars, error: varErr },
//         { data: sellers, error: sellErr }
//       ] = await Promise.all([
//         retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//             .in('id', productIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         )
//       ]);
//       if (prodErr) throw new Error(`Products fetch error: ${prodErr.message}`);
//       if (varErr) throw new Error(`Variants fetch error: ${varErr.message}`);
//       if (sellErr) throw new Error(`Sellers fetch error: ${sellErr.message}`);

//       // Filter products by seller distance and effective radius
//       const validProducts = prods.filter(p => {
//         const seller = sellers.find(x => x.id === p.seller_id);
//         if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) {
//           return false;
//         }
//         const distance = calculateDistance(buyerLocation, seller);
//         const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//         return distance !== null && distance <= effectiveRadius;
//       });

//       // Build display list (one row per variant)
//       const display = validCart
//         .map(item => {
//           const prod = validProducts.find(p => p.id === item.product_id);
//           if (!prod) {
//             return null;
//           }
//           const variant = vars.find(v => v.id === item.variant_id);
//           const images = Array.isArray(variant?.images) && variant.images.length > 0
//             ? variant.images
//             : Array.isArray(prod.images) && prod.images.length > 0
//               ? prod.images
//               : [defaultImage];

//           return {
//             cartId: item.id,
//             id: prod.id,
//             variantId: item.variant_id || null,
//             quantity: item.quantity || 1,
//             title: item.title || prod.title || prod.name || 'Unnamed Product',
//             selectedVariant: variant
//               ? {
//                   id: variant.id,
//                   attributes: variant.attributes || {},
//                   price: parseFloat(variant.price) || 0,
//                   original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                   discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                   stock: variant.stock || 0,
//                   images
//                 }
//               : null,
//             price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(prod.price) || 0,
//             original_price: variant
//               ? variant.original_price
//                 ? parseFloat(variant.original_price)
//                 : null
//               : prod.original_price
//                 ? parseFloat(prod.original_price)
//                 : null,
//             discount_amount: variant
//               ? variant.discount_amount
//                 ? parseFloat(variant.discount_amount)
//                 : 0
//               : prod.discount_amount
//                 ? parseFloat(prod.discount_amount)
//                 : 0,
//             stock: variant ? variant.stock : prod.stock || 0,
//             images,
//             uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
//             seller_id: prod.seller_id,
//             deliveryRadius: prod.delivery_radius_km || prod.categories?.max_delivery_radius_km || 40
//           };
//         })
//         .filter(item => item !== null);

//       setProducts(display);
//       setCartCount(display.length);
//       localStorage.setItem('cart', JSON.stringify(validCart));

//       // Clean up invalid cart items
//       const invalidCartIds = validCart
//         .filter(item => !display.some(d => d.cartId === item.id))
//         .map(item => item.id);
//       if (invalidCartIds.length > 0) {
//         await retryRequest(() =>
//           supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//         );
//       }
//     } catch (e) {
//       const errorMessage = e.message || 'Failed to load cart.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   // Update Supabase cart item
//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
//     if (!cartId) {
//       toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
//       return false;
//     }
//     try {
//       const product = products.find(p => p.cartId === cartId);
//       if (!product) {
//         return false;
//       }
//       const seller = await supabase.from('sellers').select('id, latitude, longitude').eq('id', product.seller_id).single();
//       if (seller.error || !seller.data) {
//         return false;
//       }
//       const distance = calculateDistance(buyerLocation, seller.data);
//       if (distance === null || distance > product.deliveryRadius) {
//         toast.error('Product is not available in your area.', { duration: 3000 });
//         return false;
//       }

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
//               title: updatedItem.title || 'Unnamed Product'
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
//       return true;
//     } catch (err) {
//       toast.error(`Failed to ${operation} quantity: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from Supabase
//   const removeFromSupabaseCart = async (userId, cartId) => {
//     if (!cartId) {
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
//       toast.error(`Failed to remove item: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from cart
//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     const updatedCart = cartItems.filter(item => item.id !== cartId);
//     setCartItems(updatedCart);
//     setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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
//         toast.error('Failed to remove item from server.', { duration: 3000 });
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   // Increase quantity
//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         return;
//       }
//       if (!cartId) {
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         const stock = product.selectedVariant ? product.selectedVariant.stock : product.stock || 0;

//         if (currentQuantity >= stock) {
//           toast.error('Stock limit reached.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'increase');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation]
//   );

//   // Decrease quantity
//   const debouncedDecreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         return;
//       }
//       if (!cartId) {
//         toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         if (currentQuantity <= 1) {
//           toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'decrease');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation]
//   );

//   // Calculate totals
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // Run cleanup and fetch on mount or location change
//   useEffect(() => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       setError('Location data unavailable. Please set your location in Jharia, Dhanbad.');
//       setLoading(false);
//       return;
//     }
//     cleanupInvalidCartItems().then(fetchCartItems);
//   }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
//           content={products[0]?.images?.[0] || defaultImage}
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
//           content={products[0]?.images?.[0] || defaultImage}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">Markeet Cart</h1>
//       {products.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               const productName = product.title || 'Unnamed Product';

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={product.images?.[0] || defaultImage}
//                     alt={`${productName} cart image`}
//                     onError={(e) => {
//                       e.target.src = defaultImage;
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
//                         {productName}
//                       </Link>
//                       {selectedVariant && Object.keys(selectedVariant.attributes || {}).length > 0 && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes)
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
//                           maximumFractionDigits: 2
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => debouncedDecreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1 || loading || isUpdating}
//                         aria-label={`Decrease quantity of ${productName}`}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
//                         {quantity}
//                       </span>
//                       <button
//                         onClick={() => debouncedIncreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock || loading || isUpdating}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading || isUpdating}
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
//                 maximumFractionDigits: 2
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn" aria-label="Proceed to checkout">
//               Proceed to Checkout
//             </Link>
//           </div>
//           <img
//             src={icon}
//             alt="Markeet Logo"
//             className="cart-icon"
//           />
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
// import icon from '../assets/icon.png';

// // Default image URL
// const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// // Retry function with exponential backoff
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       await new Promise(res => setTimeout(res, delay));
//     }
//   }
// }

// // Haversine distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Unify product+variant matching
// function matchProduct(item, product) {
//   return item.id === product.id && (item.variantId || null) === (product.selectedVariant?.id || null);
// }

// function Cart() {
//   const { buyerLocation, setCartCount } = useContext(LocationContext);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);

//   // Cleanup out-of-range/invalid cart items
//   const cleanupInvalidCartItems = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) return;
//       const userId = session.user.id;
//       const { data: currentCart, error: cartError } = await retryRequest(() =>
//         supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
//       );
//       if (cartError) throw new Error(`Cart fetch error: ${cartError.message}`);
//       if (!currentCart?.length) return;

//       const productIds = [...new Set(currentCart.map(i => i.product_id))];
//       const { data: validProducts, error: productsError } = await retryRequest(() =>
//         supabase
//           .from('products')
//           .select('id, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//           .in('id', productIds)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//       );
//       if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

//       const { data: sellers, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

//       const inRange = new Set(
//         validProducts
//           .filter(p => {
//             const seller = sellers.find(x => x.id === p.seller_id);
//             if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) return false;
//             const distance = calculateDistance(buyerLocation, seller);
//             const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//             return distance !== null && distance <= effectiveRadius;
//           })
//           .map(p => p.id)
//       );

//       const variantIds = currentCart.filter(i => i.variant_id).map(i => i.variant_id);
//       let validVariants = new Set();
//       if (variantIds.length > 0) {
//         const { data: variants, error: variantsError } = await retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         );
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
//         validVariants = new Set(variants.filter(v => inRange.has(v.product_id)).map(v => v.id));
//       }

//       const toDelete = currentCart
//         .filter(i => !inRange.has(i.product_id) || (i.variant_id && !validVariants.has(i.variant_id)))
//         .map(i => i.id);

//       if (toDelete.length) {
//         const { error: deleteError } = await retryRequest(() =>
//           supabase.from('cart').delete().in('id', toDelete).eq('user_id', userId)
//         );
//         if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
//       }
//     } catch (e) {
//       toast.error('Failed to clean up cart. Some items may not display.', { duration: 3000 });
//     }
//   }, [buyerLocation]);

//   // Fetch cart items and build display rows
//   const fetchCartItems = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: { session }, error: sessErr } = await supabase.auth.getSession();
//       if (sessErr || !session?.user) {
//         setError('Please log in to view your cart.');
//         setCartCount(0);
//         setCartItems([]);
//         setProducts([]);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }
//       const userId = session.user.id;

//       // Load cart rows
//       const { data: rows, error: cartErr } = await retryRequest(() =>
//         supabase
//           .from('cart')
//           .select('id, product_id, variant_id, quantity, price, title')
//           .eq('user_id', userId)
//       );
//       if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);
//       const validCart = rows || [];
//       setCartItems(validCart);

//       if (!validCart.length) {
//         setProducts([]);
//         setCartCount(0);
//         localStorage.setItem('cart', JSON.stringify([]));
//         return;
//       }

//       const productIds = [...new Set(validCart.map(i => i.product_id))];
//       const variantIds = validCart.map(i => i.variant_id).filter(Boolean);

//       // Fetch product+variant+seller data
//       const [
//         { data: prods, error: prodErr },
//         { data: vars, error: varErr },
//         { data: sellers, error: sellErr }
//       ] = await Promise.all([
//         retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
//             .in('id', productIds)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//             .in('id', variantIds)
//             .eq('status', 'active')
//         ),
//         retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         )
//       ]);
//       if (prodErr) throw new Error(`Products fetch error: ${prodErr.message}`);
//       if (varErr) throw new Error(`Variants fetch error: ${varErr.message}`);
//       if (sellErr) throw new Error(`Sellers fetch error: ${sellErr.message}`);

//       // Filter products by seller distance and effective radius
//       const validProducts = prods.filter(p => {
//         const seller = sellers.find(x => x.id === p.seller_id);
//         if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) {
//           return false;
//         }
//         const distance = calculateDistance(buyerLocation, seller);
//         const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
//         return distance !== null && distance <= effectiveRadius;
//       });

//       // Build display list (one row per variant)
//       const display = validCart
//         .map(item => {
//           const prod = validProducts.find(p => p.id === item.product_id);
//           if (!prod) {
//             return null;
//           }
//           const variant = vars.find(v => v.id === item.variant_id);
//           const images = Array.isArray(variant?.images) && variant.images.length > 0
//             ? variant.images
//             : Array.isArray(prod.images) && prod.images.length > 0
//               ? prod.images
//               : [defaultImage];

//           return {
//             cartId: item.id,
//             id: prod.id,
//             variantId: item.variant_id || null,
//             quantity: item.quantity || 1,
//             title: item.title || prod.title || prod.name || 'Unnamed Product',
//             selectedVariant: variant
//               ? {
//                   id: variant.id,
//                   attributes: variant.attributes || {},
//                   price: parseFloat(variant.price) || 0,
//                   original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                   discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                   stock: variant.stock || 0,
//                   images
//                 }
//               : null,
//             price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(prod.price) || 0,
//             original_price: variant
//               ? variant.original_price
//                 ? parseFloat(variant.original_price)
//                 : null
//               : prod.original_price
//                 ? parseFloat(prod.original_price)
//                 : null,
//             discount_amount: variant
//               ? variant.discount_amount
//                 ? parseFloat(variant.discount_amount)
//                 : 0
//               : prod.discount_amount
//                 ? parseFloat(prod.discount_amount)
//                 : 0,
//             stock: variant ? variant.stock : prod.stock || 0,
//             images,
//             uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
//             seller_id: prod.seller_id,
//             deliveryRadius: prod.delivery_radius_km || prod.categories?.max_delivery_radius_km || 40
//           };
//         })
//         .filter(item => item !== null);

//       setProducts(display);
//       setCartCount(display.length);
//       localStorage.setItem('cart', JSON.stringify(validCart));

//       // Clean up invalid cart items
//       const invalidCartIds = validCart
//         .filter(item => !display.some(d => d.cartId === item.id))
//         .map(item => item.id);
//       if (invalidCartIds.length > 0) {
//         await retryRequest(() =>
//           supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
//         );
//       }
//     } catch (e) {
//       const errorMessage = e.message || 'Failed to load cart.';
//       setError(errorMessage);
//       toast.error(errorMessage, { duration: 3000 });
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, setCartCount]);

//   // Update Supabase cart item
//   const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
//     if (!cartId) {
//       toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
//       return false;
//     }
//     try {
//       const product = products.find(p => p.cartId === cartId);
//       if (!product) {
//         return false;
//       }
//       const seller = await supabase.from('sellers').select('id, latitude, longitude').eq('id', product.seller_id).single();
//       if (seller.error || !seller.data) {
//         return false;
//       }
//       const distance = calculateDistance(buyerLocation, seller.data);
//       if (distance === null || distance > product.deliveryRadius) {
//         toast.error('Product is not available in your area.', { duration: 3000 });
//         return false;
//       }

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
//               title: updatedItem.title || 'Unnamed Product'
//             },
//             { onConflict: ['id'] }
//           )
//       );
//       if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
//       return true;
//     } catch (err) {
//       toast.error(`Failed to ${operation} quantity: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from Supabase
//   const removeFromSupabaseCart = async (userId, cartId) => {
//     if (!cartId) {
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
//       toast.error(`Failed to remove item: ${err.message}`, { duration: 3000 });
//       return false;
//     }
//   };

//   // Remove item from cart
//   const removeFromCart = async (cartId, productId, variantId) => {
//     if (!cartId) {
//       toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
//       return;
//     }

//     const previousCartItems = [...cartItems];
//     const previousProducts = [...products];

//     const updatedCart = cartItems.filter(item => item.id !== cartId);
//     setCartItems(updatedCart);
//     setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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
//         toast.error('Failed to remove item from server.', { duration: 3000 });
//         return;
//       }
//     }

//     toast.success('Item removed from cart!', { duration: 3000 });
//   };

//   // Increase quantity
//   const debouncedIncreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         return;
//       }
//       if (!cartId) {
//         toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         const stock = product.selectedVariant ? product.selectedVariant.stock : product.stock || 0;

//         if (currentQuantity >= stock) {
//           toast.error('Stock limit reached.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity + 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'increase');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation, updateSupabaseCartItem, removeFromSupabaseCart]
//   );

//   // Decrease quantity
//   const debouncedDecreaseQuantity = useCallback(
//     debounce(async (cartId, productId, variantId) => {
//       if (isUpdating) {
//         return;
//       }
//       if (!cartId) {
//         toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
//         return;
//       }

//       setIsUpdating(true);
//       try {
//         const cartItem = cartItems.find(item => item.id === cartId);
//         const product = products.find(p => matchProduct({ id: productId, variantId }, p));
//         if (!cartItem || !product) {
//           toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

//           const { data: { session } } = await supabase.auth.getSession();
//           if (session?.user && cartId) {
//             const success = await removeFromSupabaseCart(session.user.id, cartId);
//             if (success) {
//               const updatedCart = cartItems.filter(item => item.id !== cartId);
//               setCartItems(updatedCart);
//               localStorage.setItem('cart', JSON.stringify(updatedCart));
//               setCartCount(updatedCart.length);
//               setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
//             }
//           }
//           return;
//         }

//         const currentQuantity = cartItem.quantity || 1;
//         if (currentQuantity <= 1) {
//           toast.error('Minimum quantity reached. Use Remove to delete.', { duration: 3000 });
//           return;
//         }

//         const previousCartItems = [...cartItems];
//         const updatedCart = cartItems.map(item =>
//           item.id === cartId ? { ...item, quantity: currentQuantity - 1 } : item
//         );
//         setCartItems(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         setCartCount(updatedCart.length);

//         const { data: { session } } = await supabase.auth.getSession();
//         if (session?.user) {
//           const updatedItem = updatedCart.find(item => item.id === cartId);
//           const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
//             ...updatedItem,
//             title: product.title
//           }, 'decrease');
//           if (!success) {
//             setCartItems(previousCartItems);
//             localStorage.setItem('cart', JSON.stringify(previousCartItems));
//             setCartCount(previousCartItems.length);
//             toast.error('Failed to update cart on server.', { duration: 3000 });
//             return;
//           }
//         }

//         toast.success('Cart updated!', { duration: 3000 });
//       } finally {
//         setIsUpdating(false);
//       }
//     }, 300),
//     [cartItems, products, isUpdating, buyerLocation, updateSupabaseCartItem, removeFromSupabaseCart]
//   );

//   // Calculate totals
//   const total = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const price = product.price || 0;
//     return sum + price * quantity;
//   }, 0);

//   const discountTotal = products.reduce((sum, product) => {
//     const cartItem = cartItems.find(item => item.id === product.cartId);
//     const quantity = cartItem?.quantity || 1;
//     const discount = product.discount_amount || 0;
//     return sum + discount * quantity;
//   }, 0);

//   // Run cleanup and fetch on mount or location change
//   useEffect(() => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       setError('Location data unavailable. Please set your location in Jharia, Dhanbad.');
//       setLoading(false);
//       return;
//     }
//     cleanupInvalidCartItems().then(fetchCartItems);
//   }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
//           content={products[0]?.images?.[0] || defaultImage}
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
//           content={products[0]?.images?.[0] || defaultImage}
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'WebPage',
//             name: 'Shopping Cart - Markeet',
//             description: 'View and manage your shopping cart on Markeet.',
//             url: pageUrl
//           })}
//         </script>
//       </Helmet>
//       <h1 className="cart-title">Markeet Cart</h1>
//       {products.length === 0 ? (
//         <p className="empty-cart">Your cart is empty.</p>
//       ) : (
//         <>
//           <div className="cart-items">
//             {products.map((product, index) => {
//               const cartItem = cartItems.find(item => item.id === product.cartId);
//               if (!cartItem) {
//                 return null;
//               }

//               const quantity = cartItem.quantity || 1;
//               const selectedVariant = product.selectedVariant;
//               const productName = product.title || 'Unnamed Product';

//               return (
//                 <div key={product.uniqueKey || `${product.id}-${index}`} className="cart-item">
//                   <img
//                     src={product.images?.[0] || defaultImage}
//                     alt={`${productName}`} // Removed "cart image" to fix redundant alt warning
//                     onError={(e) => {
//                       e.target.src = defaultImage;
//                     }}
//                     className="cart-item-image"
//                   />
//                   <div className="cart-item-details">
//                     <h3 className="cart-item-title">
//                       <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
//                         {productName}
//                       </Link>
//                       {selectedVariant && Object.keys(selectedVariant.attributes || {}).length > 0 && (
//                         <span className="variant-info">
//                           {' '}
//                           -{' '}
//                           {Object.entries(selectedVariant.attributes)
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
//                           maximumFractionDigits: 2
//                         })}
//                       </span>
//                       {product.original_price && product.original_price > product.price && (
//                         <span className="cart-item-original-price">
//                           ₹{product.original_price.toLocaleString('en-IN', {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                           })}
//                         </span>
//                       )}
//                     </div>
//                     {product.discount_amount > 0 && (
//                       <p className="cart-item-discount">
//                         Save ₹{(product.discount_amount * quantity).toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2
//                         })}
//                       </p>
//                     )}
//                     <p className="cart-item-stock">
//                       {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
//                     </p>
//                     <div className="cart-quantity">
//                       <button
//                         onClick={() => debouncedDecreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity <= 1 || loading || isUpdating}
//                         aria-label={`Decrease quantity of ${productName}`}
//                       >
//                         -
//                       </button>
//                       <span className="qty-display" aria-label={`Quantity: ${quantity}`}>
//                         {quantity}
//                       </span>
//                       <button
//                         onClick={() => debouncedIncreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                         className="qty-btn"
//                         disabled={quantity >= product.stock || loading || isUpdating}
//                         aria-label={`Increase quantity of ${productName}`}
//                       >
//                         +
//                       </button>
//                     </div>
//                     <button
//                       onClick={() => removeFromCart(cartItem.id, product.id, product.selectedVariant?.id || null)}
//                       className="remove-btn"
//                       disabled={loading || isUpdating}
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
//                 maximumFractionDigits: 2
//               })}
//             </h3>
//             {discountTotal > 0 && (
//               <p className="cart-total-discount">
//                 Total Savings: ₹{discountTotal.toLocaleString('en-IN', {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2
//                 })}
//               </p>
//             )}
//             <Link to="/checkout" className="checkout-btn" aria-label="Proceed to checkout">
//               Proceed to Checkout
//             </Link>
//           </div>
//           <img
//             src={icon}
//             alt="Markeet Logo"
//             className="cart-icon"
//           />
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
import { calculateCartTotal, formatPrice } from '../utils/priceUtils';
import icon from '../assets/icon.png';

// Default image URL
const defaultImage = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// Retry function with exponential backoff
async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * 2 ** (attempt - 1);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Haversine distance calculation
function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
    return null;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Unify product+variant matching
function matchProduct(item, product) {
  return item.id === product.id && (item.variantId || null) === (product.selectedVariant?.id || null);
}

function Cart() {
  const { buyerLocation, setCartCount } = useContext(LocationContext);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cleanup out-of-range/invalid cart items
  const cleanupInvalidCartItems = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const { data: currentCart, error: cartError } = await retryRequest(() =>
        supabase.from('cart').select('id, product_id, variant_id').eq('user_id', userId)
      );
      if (cartError) throw new Error(`Cart fetch error: ${cartError.message}`);
      if (!currentCart?.length) return;

      const productIds = [...new Set(currentCart.map(i => i.product_id))];
      const { data: validProducts, error: productsError } = await retryRequest(() =>
        supabase
          .from('products')
          .select('id, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
          .in('id', productIds)
          .eq('is_approved', true)
          .eq('status', 'active')
      );
      if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

      const { data: sellers, error: sellersError } = await retryRequest(() =>
        supabase.from('sellers').select('id, latitude, longitude')
      );
      if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

      const inRange = new Set(
        validProducts
          .filter(p => {
            const seller = sellers.find(x => x.id === p.seller_id);
            if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) return false;
            const distance = calculateDistance(buyerLocation, seller);
            const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
            return distance !== null && distance <= effectiveRadius;
          })
          .map(p => p.id)
      );

      const variantIds = currentCart.filter(i => i.variant_id).map(i => i.variant_id);
      let validVariants = new Set();
      if (variantIds.length > 0) {
        const { data: variants, error: variantsError } = await retryRequest(() =>
          supabase
            .from('product_variants')
            .select('id, product_id')
            .in('id', variantIds)
            .eq('status', 'active')
        );
        if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
        validVariants = new Set(variants.filter(v => inRange.has(v.product_id)).map(v => v.id));
      }

      const toDelete = currentCart
        .filter(i => !inRange.has(i.product_id) || (i.variant_id && !validVariants.has(i.variant_id)))
        .map(i => i.id);

      if (toDelete.length) {
        const { error: deleteError } = await retryRequest(() =>
          supabase.from('cart').delete().in('id', toDelete).eq('user_id', userId)
        );
        if (deleteError) throw new Error(`Delete error: ${deleteError.message}`);
      }
    } catch (e) {
      toast.error('Failed to clean up cart. Some items may not display.', { duration: 3000 });
    }
  }, [buyerLocation, toast]);

  // Fetch cart items and build display rows
  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !session?.user) {
        setError('Please log in to view your cart.');
        setCartCount(0);
        setCartItems([]);
        setProducts([]);
        localStorage.setItem('cart', JSON.stringify([]));
        return;
      }
      const userId = session.user.id;

      // Load cart rows
      const { data: rows, error: cartErr } = await retryRequest(() =>
        supabase
          .from('cart')
          .select('id, product_id, variant_id, quantity, price, title')
          .eq('user_id', userId)
      );
      if (cartErr) throw new Error(`Cart fetch error: ${cartErr.message}`);
      const validCart = rows || [];
      setCartItems(validCart);

      if (!validCart.length) {
        setProducts([]);
        setCartCount(0);
        localStorage.setItem('cart', JSON.stringify([]));
        return;
      }

      const productIds = [...new Set(validCart.map(i => i.product_id))];
      const variantIds = validCart.map(i => i.variant_id).filter(Boolean);

      // Fetch product+variant+seller data
      const [
        { data: prods, error: prodErr },
        { data: vars, error: varErr },
        { data: sellers, error: sellErr }
      ] = await Promise.all([
        retryRequest(() =>
          supabase
            .from('products')
            .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id, delivery_radius_km, categories (id, max_delivery_radius_km)')
            .in('id', productIds)
            .eq('is_approved', true)
            .eq('status', 'active')
        ),
        retryRequest(() =>
          supabase
            .from('product_variants')
            .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
            .in('id', variantIds)
            .eq('status', 'active')
        ),
        retryRequest(() =>
          supabase.from('sellers').select('id, latitude, longitude')
        )
      ]);
      if (prodErr) throw new Error(`Products fetch error: ${prodErr.message}`);
      if (varErr) throw new Error(`Variants fetch error: ${varErr.message}`);
      if (sellErr) throw new Error(`Sellers fetch error: ${sellErr.message}`);

      // Filter products by seller distance and effective radius
      const validProducts = prods.filter(p => {
        const seller = sellers.find(x => x.id === p.seller_id);
        if (!seller || !buyerLocation?.lat || !buyerLocation?.lon) {
          return false;
        }
        const distance = calculateDistance(buyerLocation, seller);
        const effectiveRadius = p.delivery_radius_km || p.categories?.max_delivery_radius_km || 40;
        return distance !== null && distance <= effectiveRadius;
      });

      // Build display list (one row per variant)
      const display = validCart
        .map(item => {
          const prod = validProducts.find(p => p.id === item.product_id);
          if (!prod) {
            return null;
          }
          const variant = vars.find(v => v.id === item.variant_id);
          const images = Array.isArray(variant?.images) && variant.images.length > 0
            ? variant.images
            : Array.isArray(prod.images) && prod.images.length > 0
              ? prod.images
              : [defaultImage];

          return {
            cartId: item.id,
            id: prod.id,
            variantId: item.variant_id || null,
            quantity: item.quantity || 1,
            title: item.title || prod.title || prod.name || 'Unnamed Product',
            selectedVariant: variant
              ? {
                  id: variant.id,
                  attributes: variant.attributes || {},
                  price: parseFloat(variant.price) || 0,
                  original_price: variant.original_price ? parseFloat(variant.original_price) : null,
                  discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
                  stock: variant.stock || 0,
                  images
                }
              : null,
            price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(prod.price) || 0,
            original_price: variant
              ? variant.original_price
                ? parseFloat(variant.original_price)
                : null
              : prod.original_price
                ? parseFloat(prod.original_price)
                : null,
            discount_amount: variant
              ? variant.discount_amount
                ? parseFloat(variant.discount_amount)
                : 0
              : prod.discount_amount
                ? parseFloat(prod.discount_amount)
                : 0,
            stock: variant ? variant.stock : prod.stock || 0,
            images,
            uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
            seller_id: prod.seller_id,
            deliveryRadius: prod.delivery_radius_km || prod.categories?.max_delivery_radius_km || 40
          };
        })
        .filter(item => item !== null);

      setProducts(display);
      setCartCount(display.length);
      localStorage.setItem('cart', JSON.stringify(validCart));

      // Clean up invalid cart items
      const invalidCartIds = validCart
        .filter(item => !display.some(d => d.cartId === item.id))
        .map(item => item.id);
      if (invalidCartIds.length > 0) {
        await retryRequest(() =>
          supabase.from('cart').delete().eq('user_id', userId).in('id', invalidCartIds)
        );
      }
    } catch (e) {
      const errorMessage = e.message || 'Failed to load cart.';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [buyerLocation, setCartCount, setCartItems, setProducts, toast]);

  // Update Supabase cart item
  const updateSupabaseCartItem = async (userId, cartId, productId, updatedItem, operation) => {
    if (!cartId) {
      toast.error(`Cannot ${operation} quantity: Invalid cart ID.`, { duration: 3000 });
      return false;
    }
    try {
      const product = products.find(p => p.cartId === cartId);
      if (!product) {
        return false;
      }
      const seller = await supabase.from('sellers').select('id, latitude, longitude').eq('id', product.seller_id).single();
      if (seller.error || !seller.data) {
        return false;
      }
      const distance = calculateDistance(buyerLocation, seller.data);
      if (distance === null || distance > product.deliveryRadius) {
        toast.error('Product is not available in your area.', { duration: 3000 });
        return false;
      }

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
              title: updatedItem.title || 'Unnamed Product'
            },
            { onConflict: ['id'] }
          )
      );
      if (upsertError) throw new Error(`Failed to ${operation} quantity: ${upsertError.message}`);
      return true;
    } catch (err) {
      toast.error(`Failed to ${operation} quantity: ${err.message}`, { duration: 3000 });
      return false;
    }
  };

  // Remove item from Supabase
  const removeFromSupabaseCart = async (userId, cartId) => {
    if (!cartId) {
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
      toast.error(`Failed to remove item: ${err.message}`, { duration: 3000 });
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartId, productId, variantId) => {
    if (!cartId) {
      toast.error('Cannot remove item: Invalid cart ID.', { duration: 3000 });
      return;
    }

    const previousCartItems = [...cartItems];
    const previousProducts = [...products];

    const updatedCart = cartItems.filter(item => item.id !== cartId);
    setCartItems(updatedCart);
    setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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

  // Increase quantity
  const debouncedIncreaseQuantity = useCallback(
    debounce(async (cartId, productId, variantId) => {
      if (isUpdating) {
        return;
      }
      if (!cartId) {
        toast.error('Cannot increase quantity: Invalid cart ID.', { duration: 3000 });
        return;
      }

      setIsUpdating(true);
      try {
        const cartItem = cartItems.find(item => item.id === cartId);
        const product = products.find(p => matchProduct({ id: productId, variantId }, p));
        if (!cartItem || !product) {
          toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && cartId) {
            const success = await removeFromSupabaseCart(session.user.id, cartId);
            if (success) {
              const updatedCart = cartItems.filter(item => item.id !== cartId);
              setCartItems(updatedCart);
              localStorage.setItem('cart', JSON.stringify(updatedCart));
              setCartCount(updatedCart.length);
              setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
            }
          }
          return;
        }

        const currentQuantity = cartItem.quantity || 1;
        const stock = product.selectedVariant ? product.selectedVariant.stock : product.stock || 0;

        if (currentQuantity >= stock) {
          toast.error('Stock limit reached.', { duration: 3000 });
          return;
        }

        const previousCartItems = [...cartItems];
        const updatedCart = cartItems.map(item =>
          item.id === cartId ? { ...item, quantity: currentQuantity + 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCartCount(updatedCart.length);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const updatedItem = updatedCart.find(item => item.id === cartId);
          const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
            ...updatedItem,
            title: product.title
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
    [cartItems, products, isUpdating, buyerLocation, updateSupabaseCartItem, removeFromSupabaseCart, toast, setCartItems, setProducts, setCartCount, matchProduct]
  );

  // Decrease quantity
  const debouncedDecreaseQuantity = useCallback(
    debounce(async (cartId, productId, variantId) => {
      if (isUpdating) {
        return;
      }
      if (!cartId) {
        toast.error('Cannot decrease quantity: Invalid cart ID.', { duration: 3000 });
        return;
      }

      setIsUpdating(true);
      try {
        const cartItem = cartItems.find(item => item.id === cartId);
        const product = products.find(p => matchProduct({ id: productId, variantId }, p));
        if (!cartItem || !product) {
          toast.error('Item not found in cart. Removing invalid item.', { duration: 3000 });

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && cartId) {
            const success = await removeFromSupabaseCart(session.user.id, cartId);
            if (success) {
              const updatedCart = cartItems.filter(item => item.id !== cartId);
              setCartItems(updatedCart);
              localStorage.setItem('cart', JSON.stringify(updatedCart));
              setCartCount(updatedCart.length);
              setProducts(prev => prev.filter(p => !matchProduct({ id: productId, variantId }, p)));
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
        const updatedCart = cartItems.map(item =>
          item.id === cartId ? { ...item, quantity: currentQuantity - 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCartCount(updatedCart.length);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const updatedItem = updatedCart.find(item => item.id === cartId);
          const success = await updateSupabaseCartItem(session.user.id, cartId, productId, {
            ...updatedItem,
            title: product.title
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
    [cartItems, products, isUpdating, buyerLocation, updateSupabaseCartItem, removeFromSupabaseCart, toast, setCartItems, setProducts, setCartCount, matchProduct]
  );

  // Calculate totals using shared price utilities
  const cartItemsWithPrices = products.map(product => {
    const cartItem = cartItems.find(item => item.id === product.cartId);
    const quantity = cartItem?.quantity || 1;
    return {
      price: product.price || 0,
      quantity,
      discount_amount: product.discount_amount || 0
    };
  });

  const total = calculateCartTotal(cartItemsWithPrices);
  const discountTotal = cartItemsWithPrices.reduce((sum, item) => {
    return sum + (item.discount_amount * item.quantity);
  }, 0);

  // Run cleanup and fetch on mount or location change
  useEffect(() => {
    if (!buyerLocation?.lat || !buyerLocation?.lon) {
      setError('Location data unavailable. Please set your location in Jharia, Dhanbad.');
      setLoading(false);
      return;
    }
    cleanupInvalidCartItems().then(fetchCartItems);
  }, [buyerLocation, cleanupInvalidCartItems, fetchCartItems]);

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
          content={products[0]?.images?.[0] || defaultImage}
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
          content={products[0]?.images?.[0] || defaultImage}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Shopping Cart - Markeet',
            description: 'View and manage your shopping cart on Markeet.',
            url: pageUrl
          })}
        </script>
      </Helmet>
      <h1 className="cart-title">Markeet Cart</h1>
      {products.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {products.map((product, index) => {
              const cartItem = cartItems.find(item => item.id === product.cartId);
              if (!cartItem) {
                return null;
              }

              const quantity = cartItem.quantity || 1;
              const selectedVariant = product.selectedVariant;
              const productName = product.title || 'Unnamed Product';

              return (
                <div key={product.uniqueKey || `${product.id}-${index}`} className="cart-item">
                  <img
                    src={product.images?.[0] || defaultImage}
                    alt={`${productName}`} // Removed "cart image" to fix redundant alt warning
                    onError={(e) => {
                      e.target.src = defaultImage;
                    }}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">
                      <Link to={`/product/${product.id}`} aria-label={`View ${productName}`}>
                        {productName}
                      </Link>
                      {selectedVariant && Object.keys(selectedVariant.attributes || {}).length > 0 && (
                        <span className="variant-info">
                          {' '}
                          -{' '}
                          {Object.entries(selectedVariant.attributes)
                            .filter(([key, val]) => val && val.trim())
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ')}
                        </span>
                      )}
                    </h3>
                    <div className="cart-item-price-section">
                      <span className="cart-item-price">
                        {formatPrice(product.price || 0)}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="cart-item-original-price">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    {product.discount_amount > 0 && (
                      <p className="cart-item-discount">
                        Save {formatPrice(product.discount_amount * quantity)}
                      </p>
                    )}
                    <p className="cart-item-stock">
                      {product.stock > 0 ? `In Stock: ${product.stock} available` : 'Out of Stock'}
                    </p>
                    <div className="cart-quantity">
                      <button
                        onClick={() => debouncedDecreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
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
                        onClick={() => debouncedIncreaseQuantity(cartItem.id, product.id, product.selectedVariant?.id || null)}
                        className="qty-btn"
                        disabled={quantity >= product.stock || loading || isUpdating}
                        aria-label={`Increase quantity of ${productName}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(cartItem.id, product.id, product.selectedVariant?.id || null)}
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
              Subtotal: {formatPrice(total)}
            </h3>
            {discountTotal > 0 && (
              <p className="cart-total-discount">
                Total Savings: {formatPrice(discountTotal)}
              </p>
            )}
            <Link to="/checkout" className="checkout-btn" aria-label="Proceed to checkout">
              Proceed to Checkout
            </Link>
          </div>
          <img
            src={icon}
            alt="Markeet Logo"
            className="cart-icon"
          />
        </>
      )}
      <Footer />
    </div>
  );
}

export default Cart;