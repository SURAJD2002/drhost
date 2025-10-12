// // src/hooks/useFetchCartProducts.js
// import { useCallback, useState } from 'react';
// import { supabase } from '../supabaseClient';

// // Utility function for retrying Supabase requests
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

// // Utility function to calculate distance
// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc ||
//     !sellerLoc ||
//     !sellerLoc.latitude ||
//     !sellerLoc.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
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

// export function useFetchCartProducts(userLocation) {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCartProducts = useCallback(
//     async (cart) => {
//       setLoading(true);
//       try {
//         if (cart.length === 0) {
//           setProducts([]);
//           setLoading(false);
//           return;
//         }

//         const productIds = cart.map((item) => item.id).filter(Boolean);
//         if (productIds.length === 0) {
//           setProducts([]);
//           setLoading(false);
//           return;
//         }

//         const { data: productData, error: productError } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select(`
//               id,
//               seller_id,
//               title,
//               name,
//               price,
//               images,
//               product_variants!product_variants_product_id_fkey(price, images)
//             `)
//             .in('id', productIds)
//             .eq('is_approved', true)
//         );

//         if (productError) throw productError;

//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw sellersError;

//         const validProducts = productData
//           .map((product) => {
//             const storedItem = cart.find((item) => item.id === product.id);
//             const seller = sellersData.find((s) => s.id === product.seller_id);
//             if (!seller || calculateDistance(userLocation, seller) > 40) {
//               return null;
//             }

//             if (storedItem && storedItem.selectedVariant) {
//               return {
//                 ...product,
//                 selectedVariant: storedItem.selectedVariant,
//                 price: storedItem.selectedVariant.price || product.price,
//                 images: storedItem.selectedVariant.images?.length
//                   ? storedItem.selectedVariant.images
//                   : product.images,
//               };
//             }

//             const variantWithImages = product.product_variants?.find(
//               (v) => Array.isArray(v.images) && v.images.length > 0
//             );
//             const finalImages = product.images?.length
//               ? product.images
//               : variantWithImages?.images || [
//                   'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
//                 ];
//             const productPrice =
//               product.price !== null && product.price !== undefined
//                 ? product.price
//                 : variantWithImages?.price || 0;
//             return {
//               ...product,
//               images: finalImages,
//               price: productPrice,
//             };
//           })
//           .filter((p) => p !== null);

//         setProducts(validProducts);
//       } catch (error) {
//         console.error('Error fetching checkout products:', error);
//         setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [userLocation]
//   );

//   return { fetchCartProducts, products, loading, error, setLoading, setError, setProducts };
// }


// import { useState, useCallback } from 'react';
// import { supabase } from '../supabaseClient';

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

// export function useFetchCartProducts(userLocation) {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCartProducts = useCallback(async (cartItems) => {
//     if (!cartItems || cartItems.length === 0 || !userLocation) {
//       setProducts([]);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     try {
//       const productIds = [...new Set(cartItems.map(item => item.id).filter(Boolean))];
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
//             stock,
//             images,
//             discount_amount,
//             commission_amount
//           `)
//           .in('id', productIds)
//           .eq('is_approved', true)
//       );
//       if (productError) throw productError;

//       // Fetch variants
//       const { data: variantData, error: variantError } = await retryRequest(() =>
//         supabase
//           .from('product_variants')
//           .select('id, product_id, attributes, price, images, stock')
//           .in('product_id', productIds)
//       );
//       if (variantError) throw variantError;

//       // Fetch sellers
//       const { data: sellersData, error: sellersError } = await retryRequest(() =>
//         supabase.from('sellers').select('id, latitude, longitude')
//       );
//       if (sellersError) throw sellersError;

//       console.log('Fetched products:', productData);
//       console.log('Fetched variants:', variantData);
//       console.log('Fetched sellers:', sellersData);

//       const validProducts = (productData || [])
//         .filter(product => product.id && (product.title || product.name))
//         .map(product => {
//           const seller = sellersData.find(s => s.id === product.seller_id);
//           if (!seller || calculateDistance(userLocation, { lat: seller.latitude, lon: seller.longitude }) > 40) {
//             return null;
//           }

//           const storedItem = cartItems.find(item => item.id === product.id && item.variantId === (variantData.find(v => v.id === item.variantId)?.id || null));
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
//       setError(null);
//     } catch (err) {
//       console.error('Cart fetch error:', err);
//       setError(`Failed to load cart: ${err.message || 'Please try again.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [userLocation]);

//   return { fetchCartProducts, products, loading, error, setProducts, setLoading, setError };
// }



// import { useState, useCallback } from 'react';
// import { supabase } from '../supabaseClient';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

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

// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
//     return null;
//   }
//   const R = 6371;
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export function useFetchCartProducts(userLocation) {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCartProducts = useCallback(
//     async cartItems => {
//       console.log('fetchCartProducts called with cartItems:', JSON.stringify(cartItems, null, 2));
//       console.log('userLocation:', userLocation);

//       if (!cartItems?.length || !userLocation?.lat || !userLocation?.lon) {
//         console.warn('Invalid input:', { hasCartItems: !!cartItems?.length, hasLocation: !!userLocation?.lat });
//         setProducts([]);
//         setLoading(false);
//         setError(!cartItems?.length ? 'Cart is empty.' : 'User location unavailable.');
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       try {
//         const productIds = [...new Set(cartItems.map(item => item.product_id).filter(Boolean))];
//         const variantIds = cartItems.map(item => item.variant_id).filter(Boolean);

//         console.log('productIds:', productIds);
//         console.log('variantIds:', variantIds);

//         if (!productIds.length) {
//           setProducts([]);
//           setLoading(false);
//           setError('No valid products in cart.');
//           return;
//         }

//         const [
//           { data: productsData, error: productsError },
//           { data: variantsData, error: variantsError },
//           { data: sellersData, error: sellersError }
//         ] = await Promise.all([
//           retryRequest(() =>
//             supabase
//               .from('products')
//               .select('id, title, name, price, original_price, discount_amount, stock, images, seller_id')
//               .in('id', productIds)
//               .eq('is_approved', true)
//               .eq('status', 'active')
//           ),
//           retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//               .in('id', variantIds)
//               .eq('status', 'active')
//           ),
//           retryRequest(() => supabase.from('sellers').select('id, latitude, longitude'))
//         ]);

//         if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
//         if (sellersError) throw new Error(`Sellers fetch error: ${sellersError.message}`);

//         console.log('Fetched products:', productsData);
//         console.log('Fetched variants:', variantsData);
//         console.log('Fetched sellers:', sellersData);

//         const validProducts = (productsData || []).filter(product => {
//           if (!product.id || (!product.title && !product.name)) {
//             console.warn(`Skipping invalid product: ${product.id}`, product);
//             return false;
//           }
//           const seller = sellersData.find(s => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(userLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude
//           });
//           return distance !== null && distance <= 40;
//         });

//         const displayProducts = cartItems
//           .map(item => {
//             const product = validProducts.find(p => p.id === item.product_id);
//             if (!product) {
//               console.warn(`Product not found for cart item: ${item.product_id}`, item);
//               return null;
//             }

//             const variant = variantsData.find(v => v.id === item.variant_id);
//             const images =
//               Array.isArray(variant?.images) && variant.images.length > 0
//                 ? variant.images
//                 : Array.isArray(product.images) && product.images.length > 0
//                   ? product.images
//                   : [DEFAULT_IMAGE];

//             return {
//               cartId: item.id,
//               id: product.id,
//               variantId: item.variant_id || null,
//               title: item.title || product.title || product.name || 'Unnamed Product',
//               selectedVariant: variant
//                 ? {
//                     id: variant.id,
//                     attributes: variant.attributes || {},
//                     price: parseFloat(variant.price) || 0,
//                     original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                     discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                     stock: variant.stock || 0,
//                     images
//                   }
//                 : null,
//               price: variant ? parseFloat(variant.price) : parseFloat(item.price) || parseFloat(product.price) || 0,
//               original_price: variant
//                 ? variant.original_price
//                   ? parseFloat(variant.original_price)
//                   : null
//                 : product.original_price
//                   ? parseFloat(product.original_price)
//                   : null,
//               discount_amount: variant
//                 ? variant.discount_amount
//                   ? parseFloat(variant.discount_amount)
//                   : 0
//                 : product.discount_amount
//                   ? parseFloat(product.discount_amount)
//                   : 0,
//               stock: variant ? variant.stock : product.stock || 0,
//               images,
//               seller_id: product.seller_id,
//               uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`
//             };
//           })
//           .filter(item => item !== null);

//         console.log('Display products:', displayProducts);
//         setProducts(displayProducts);
//         setError(null);
//       } catch (err) {
//         console.error('Cart fetch error:', err.message);
//         setError(`Failed to load cart: ${err.message || 'Please try again.'}`);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [userLocation]
//   );

//   return { fetchCartProducts, products, loading, error, setProducts, setLoading, setError };
// }




// import { useState, useCallback } from 'react';
// import { supabase } from '../supabaseClient';

// const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * 2 ** (attempt - 1);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// function calculateDistance(userLoc, productLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !productLoc?.latitude ||
//     !productLoc?.longitude ||
//     productLoc.latitude === 0 ||
//     productLoc.longitude === 0
//   ) {
//     return 0; // Assume in range to avoid filtering out products
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(productLoc.latitude * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export function useFetchCartProducts(userLocation) {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCartProducts = useCallback(
//     async cartItems => {
//       if (!cartItems?.length || !userLocation?.lat || !userLocation?.lon) {
//         setProducts([]);
//         setLoading(false);
//         setError(!cartItems?.length ? 'Cart is empty.' : 'User location unavailable.');
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       try {
//         const productIds = [...new Set(cartItems.map(item => item.product_id).filter(Boolean))];
//         const variantIds = cartItems.map(item => item.variant_id).filter(Boolean);

//         if (!productIds.length) {
//           setProducts([]);
//           setLoading(false);
//           setError('No valid products in cart.');
//           return;
//         }

//         const [
//           { data: productsData, error: productsError },
//           { data: variantsData, error: variantsError },
//         ] = await Promise.all([
//           retryRequest(() =>
//             supabase
//               .from('products')
//               .select('id, title, name, price, sale_price, original_price, discount_amount, stock, images, seller_id, seller_name, latitude, longitude')
//               .in('id', productIds)
//               .eq('is_approved', true)
//               .eq('status', 'active')
//           ),
//           retryRequest(() =>
//             supabase
//               .from('product_variants')
//               .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
//               .in('id', variantIds)
//               .eq('status', 'active')
//           ),
//         ]);

//         if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);
//         if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);

//         const validProducts = (productsData || []).filter(product => {
//           if (!product.id || (!product.title && !product.name)) {
//             return false;
//           }
//           const distance = calculateDistance(userLocation, {
//             latitude: product.latitude,
//             longitude: product.longitude,
//           });
//           return distance <= 40; // Max delivery radius of 40km
//         });

//         const displayProducts = cartItems
//           .map(item => {
//             const product = validProducts.find(p => p.id === item.product_id);
//             if (!product) {
//               return null;
//             }

//             const variant = variantsData.find(v => v.id === item.variant_id);
//             const images =
//               Array.isArray(variant?.images) && variant.images.length > 0
//                 ? variant.images
//                 : Array.isArray(product.images) && product.images.length > 0
//                   ? product.images
//                   : [DEFAULT_IMAGE];

//             return {
//               cartId: item.id,
//               id: product.id,
//               variantId: item.variant_id || null,
//               title: item.title || product.title || product.name || 'Unnamed Product',
//               selectedVariant: variant
//                 ? {
//                     id: variant.id,
//                     attributes: variant.attributes || {},
//                     price: parseFloat(variant.price) || 0,
//                     original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//                     discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//                     stock: variant.stock || 0,
//                     images,
//                   }
//                 : null,
//               price: variant ? parseFloat(variant.price) : parseFloat(product.sale_price || product.price) || 0,
//               original_price: variant
//                 ? variant.original_price
//                   ? parseFloat(variant.original_price)
//                   : null
//                 : product.original_price
//                   ? parseFloat(product.original_price)
//                   : null,
//               discount_amount: variant
//                 ? variant.discount_amount
//                   ? parseFloat(variant.discount_amount)
//                   : 0
//                 : product.discount_amount
//                   ? parseFloat(product.discount_amount)
//                   : 0,
//               stock: variant ? variant.stock : product.stock || 0,
//               images,
//               seller_id: product.seller_id,
//               seller_name: product.seller_name || 'Unknown Seller',
//               uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
//             };
//           })
//           .filter(item => item !== null);

//         setProducts(displayProducts);
//         setError(null);
//       } catch (err) {
//         setError('Failed to load cart products. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [userLocation],
//   );

//   return { fetchCartProducts, products, loading, error, setProducts, setLoading, setError };
// }



import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_IMAGE = 'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg';

async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = initialDelay * 2 ** (attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function calculateDistance(userLoc, productLoc) {
  if (
    !userLoc?.lat ||
    !userLoc?.lon ||
    !productLoc?.latitude ||
    !productLoc?.longitude ||
    !productLoc?.delivery_radius_km ||
    productLoc.latitude === 0 ||
    productLoc.longitude === 0
  ) {
    return null; // Indicate invalid data
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const dLon = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLoc.lat * Math.PI) / 180) *
    Math.cos((productLoc.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export function useFetchCartProducts(userLocation) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invalidProducts, setInvalidProducts] = useState([]);

  const fetchCartProducts = useCallback(
    async (cartItems, onInvalidProducts) => {
      if (!cartItems?.length || !userLocation?.lat || !userLocation?.lon) {
        setProducts([]);
        setInvalidProducts([]);
        setLoading(false);
        setError(!cartItems?.length ? 'Cart is empty.' : 'User location unavailable.');
        return;
      }

      setLoading(true);
      setError(null);
      setInvalidProducts([]);

      try {
        const productIds = [...new Set(cartItems.map(item => item.product_id).filter(Boolean))];
        const variantIds = cartItems.map(item => item.variant_id).filter(Boolean);

        if (!productIds.length) {
          setProducts([]);
          setInvalidProducts([]);
          setLoading(false);
          setError('No valid products in cart.');
          return;
        }

        const [
          { data: productsData, error: productsError },
          { data: variantsData, error: variantsError },
        ] = await Promise.all([
          retryRequest(() =>
            supabase
              .from('products')
              .select('id, title, name, price, sale_price, original_price, discount_amount, stock, images, seller_id, seller_name, latitude, longitude, delivery_radius_km')
              .in('id', productIds)
              .eq('is_approved', true)
              .eq('status', 'active')
              .not('latitude', 'is', null)
              .not('longitude', 'is', null)
              .not('delivery_radius_km', 'is', null)
          ),
          retryRequest(() =>
            supabase
              .from('product_variants')
              .select('id, product_id, attributes, price, original_price, discount_amount, stock, images')
              .in('id', variantIds)
              .eq('status', 'active')
          ),
        ]);

        if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);
        if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);

        const invalid = [];
        const validProducts = (productsData || []).filter(product => {
          if (!product.id || (!product.title && !product.name)) {
            invalid.push(product.title || product.name || 'Unnamed Product');
            return false;
          }
          const distance = calculateDistance(userLocation, {
            latitude: product.latitude,
            longitude: product.longitude,
            delivery_radius_km: product.delivery_radius_km,
          });
          if (distance === null) {
            invalid.push(product.title || product.name || 'Unnamed Product');
            return false;
          }
          return distance <= product.delivery_radius_km;
        });

        if (invalid.length > 0) {
          setInvalidProducts(invalid);
          if (onInvalidProducts) {
            onInvalidProducts(invalid);
          }
        }

        const displayProducts = cartItems
          .map(item => {
            const product = validProducts.find(p => p.id === item.product_id);
            if (!product) {
              return null;
            }

            const variant = variantsData.find(v => v.id === item.variant_id);
            const images =
              Array.isArray(variant?.images) && variant.images.length > 0
                ? variant.images
                : Array.isArray(product.images) && product.images.length > 0
                  ? product.images
                  : [DEFAULT_IMAGE];

            return {
              cartId: item.id,
              id: product.id,
              variantId: item.variant_id || null,
              title: item.title || product.title || product.name || 'Unnamed Product',
              selectedVariant: variant
                ? {
                    id: variant.id,
                    attributes: variant.attributes || {},
                    price: parseFloat(variant.price) || 0,
                    original_price: variant.original_price ? parseFloat(variant.original_price) : null,
                    discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
                    stock: variant.stock || 0,
                    images,
                  }
                : null,
              price: variant ? parseFloat(variant.price) : parseFloat(product.sale_price || product.price) || 0,
              original_price: variant
                ? variant.original_price
                  ? parseFloat(variant.original_price)
                  : null
                : product.original_price
                  ? parseFloat(product.original_price)
                  : null,
              discount_amount: variant
                ? variant.discount_amount
                  ? parseFloat(variant.discount_amount)
                  : 0
                : product.discount_amount
                  ? parseFloat(product.discount_amount)
                  : 0,
              stock: variant ? variant.stock : product.stock || 0,
              images,
              seller_id: product.seller_id,
              seller_name: product.seller_name || 'Unknown Seller',
              latitude: product.latitude,
              longitude: product.longitude,
              delivery_radius_km: product.delivery_radius_km,
              uniqueKey: `${item.product_id}-${item.variant_id || 'no-variant'}-${item.id}`,
            };
          })
          .filter(item => item !== null);

        setProducts(displayProducts);
        setError(null);
      } catch (err) {
        console.error('Cart products fetch error:', err);
        setError('Failed to load cart products. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  return { fetchCartProducts, products, loading, error, invalidProducts, setProducts, setLoading, setError };
}