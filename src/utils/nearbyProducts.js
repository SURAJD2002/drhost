import { supabase } from '../supabaseClient';

/**
 * Utility functions for nearby products functionality
 */

/**
 * Get user's current location using navigator.geolocation
 * @returns {Promise<{lat: number, lon: number}>} User's coordinates
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Filter products by distance from user location
 * @param {Array} products - Array of products with location data
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Array} Filtered products within delivery radius
 */
export const filterNearbyProducts = (products, userLat, userLon) => {
  return products.filter((product) => {
    // Use product coordinates if available, otherwise fall back to seller coordinates
    const productLat = product.latitude || product.sellers?.latitude;
    const productLon = product.longitude || product.sellers?.longitude;

    if (!productLat || !productLon) {
      return false;
    }

    // Calculate distance
    const distance = calculateDistance(userLat, userLon, productLat, productLon);

    // Get delivery radius (product-specific or category default or 50km)
    const deliveryRadius = product.delivery_radius_km || 
                          product.categories?.max_delivery_radius_km || 
                          50;

    return distance <= deliveryRadius;
  });
};

/**
 * Fetch nearby products from Supabase
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} limit - Maximum number of products to fetch
 * @param {number} categoryId - Optional category filter
 * @returns {Promise<Array>} Array of nearby products
 */
export const fetchNearbyProducts = async (userLat, userLon, limit = null, categoryId = null) => {
  try {
    // Build base query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        title,
        description,
        price,
        original_price,
        discount_amount,
        images,
        stock,
        status,
        category_id,
        seller_id,
        latitude,
        longitude,
        delivery_radius_km,
        created_at,
        categories!inner(
          id,
          name,
          max_delivery_radius_km,
          is_restricted
        ),
        sellers!inner(
          id,
          store_name,
          latitude,
          longitude
        )
      `)
      .eq('is_approved', true)
      .eq('status', 'active')
      .eq('categories.is_restricted', false)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false });

    // Add category filter if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    // Filter products by distance
    const nearbyProducts = filterNearbyProducts(products || [], userLat, userLon);

    // Return all nearby products (no limit)
    return nearbyProducts;

  } catch (error) {
    console.error('Error in fetchNearbyProducts:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

/**
 * Fetch nearby products using Supabase RPC function
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Promise<Array>} Array of nearby products
 */
export const fetchNearbyProductsRPC = async (userLat, userLon) => {
  // RPC function disabled due to database structure issues
  // Using reliable fallback query instead
  console.log('Using fallback query for nearby products (RPC disabled)');
  return fetchNearbyProducts(userLat, userLon, null); // No limit - fetch all nearby products
};

/**
 * Check if location services are available and get user permission
 * @returns {Promise<boolean>} True if location is available
 */
export const checkLocationPermission = async () => {
  if (!navigator.geolocation) {
    return false;
  }

  try {
    // Check if we can get current position
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => reject(error),
        { timeout: 5000 }
      );
    });
    return true;
  } catch (error) {
    console.warn('Location permission denied or unavailable:', error);
    return false;
  }
};

/**
 * Get user location with fallback
 * @returns {Promise<{lat: number, lon: number} | null>} User coordinates or null
 */
export const getUserLocationWithFallback = async () => {
  try {
    return await getUserLocation();
  } catch (error) {
    console.warn('Could not get user location:', error);
    return null;
  }
};

const nearbyProductsUtils = {
  getUserLocation,
  calculateDistance,
  filterNearbyProducts,
  fetchNearbyProducts,
  fetchNearbyProductsRPC,
  checkLocationPermission,
  getUserLocationWithFallback,
};

export default nearbyProductsUtils;
