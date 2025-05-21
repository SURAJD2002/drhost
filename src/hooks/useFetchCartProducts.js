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


import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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

function calculateDistance(userLoc, sellerLoc) {
  if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
  const R = 6371;
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

export function useFetchCartProducts(userLocation) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCartProducts = useCallback(async (cartItems) => {
    if (!cartItems || cartItems.length === 0 || !userLocation) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const productIds = [...new Set(cartItems.map(item => item.id).filter(Boolean))];
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch products
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
            stock,
            images,
            discount_amount,
            commission_amount
          `)
          .in('id', productIds)
          .eq('is_approved', true)
      );
      if (productError) throw productError;

      // Fetch variants
      const { data: variantData, error: variantError } = await retryRequest(() =>
        supabase
          .from('product_variants')
          .select('id, product_id, attributes, price, images, stock')
          .in('product_id', productIds)
      );
      if (variantError) throw variantError;

      // Fetch sellers
      const { data: sellersData, error: sellersError } = await retryRequest(() =>
        supabase.from('sellers').select('id, latitude, longitude')
      );
      if (sellersError) throw sellersError;

      console.log('Fetched products:', productData);
      console.log('Fetched variants:', variantData);
      console.log('Fetched sellers:', sellersData);

      const validProducts = (productData || [])
        .filter(product => product.id && (product.title || product.name))
        .map(product => {
          const seller = sellersData.find(s => s.id === product.seller_id);
          if (!seller || calculateDistance(userLocation, { lat: seller.latitude, lon: seller.longitude }) > 40) {
            return null;
          }

          const storedItem = cartItems.find(item => item.id === product.id && item.variantId === (variantData.find(v => v.id === item.variantId)?.id || null));
          const variants = variantData.filter(v => v.product_id === product.id);

          if (storedItem?.selectedVariant) {
            return {
              ...product,
              selectedVariant: storedItem.selectedVariant,
              price: storedItem.selectedVariant.price || product.original_price || product.price || 0,
              stock: storedItem.selectedVariant.stock !== undefined ? storedItem.selectedVariant.stock : product.stock,
              images: storedItem.selectedVariant.images?.length ? storedItem.selectedVariant.images : product.images,
              product_variants: variants,
            };
          }

          const variant = storedItem?.variantId ? variants.find(v => v.id === storedItem.variantId) : null;
          if (variant) {
            return {
              ...product,
              selectedVariant: variant,
              price: variant.price || product.original_price || product.price || 0,
              stock: variant.stock !== undefined ? variant.stock : product.stock,
              images: variant.images?.length ? variant.images : product.images,
              product_variants: variants,
            };
          }

          const variantWithImages = variants.find(v => Array.isArray(v.images) && v.images.length > 0);
          const finalImages = product.images?.length
            ? product.images
            : variantWithImages?.images || [
                'https://arrettgksxgdajacsmbe.supabase.co/storage/v1/object/public/product-images/default.jpg',
              ];
          const productPrice = product.original_price || product.price || variantWithImages?.price || 0;
          const productStock = product.stock !== undefined
            ? product.stock
            : variantWithImages?.stock !== undefined
            ? variantWithImages.stock
            : 0;
          return {
            ...product,
            images: finalImages,
            price: productPrice,
            stock: productStock,
            product_variants: variants,
          };
        })
        .filter(p => p !== null);

      setProducts(validProducts);
      setError(null);
    } catch (err) {
      console.error('Cart fetch error:', err);
      setError(`Failed to load cart: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  return { fetchCartProducts, products, loading, error, setProducts, setLoading, setError };
}