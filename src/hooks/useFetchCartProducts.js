// src/hooks/useFetchCartProducts.js
import { useCallback, useState } from 'react';
import { supabase } from '../supabaseClient';

// Utility function for retrying Supabase requests
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

// Utility function to calculate distance
function calculateDistance(userLoc, sellerLoc) {
  if (
    !userLoc ||
    !sellerLoc ||
    !sellerLoc.latitude ||
    !sellerLoc.longitude ||
    sellerLoc.latitude === 0 ||
    sellerLoc.longitude === 0
  ) {
    return null;
  }
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

export function useFetchCartProducts(userLocation) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCartProducts = useCallback(
    async (cart) => {
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

        const { data: productData, error: productError } = await retryRequest(() =>
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

        if (productError) throw productError;

        const { data: sellersData, error: sellersError } = await retryRequest(() =>
          supabase.from('sellers').select('id, latitude, longitude')
        );
        if (sellersError) throw sellersError;

        const validProducts = productData
          .map((product) => {
            const storedItem = cart.find((item) => item.id === product.id);
            const seller = sellersData.find((s) => s.id === product.seller_id);
            if (!seller || calculateDistance(userLocation, seller) > 40) {
              return null;
            }

            if (storedItem && storedItem.selectedVariant) {
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
            const finalImages = product.images?.length
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
      } catch (error) {
        console.error('Error fetching checkout products:', error);
        setError(`Error: ${error.message || 'Failed to fetch checkout products.'}`);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  return { fetchCartProducts, products, loading, error, setLoading, setError, setProducts };
}