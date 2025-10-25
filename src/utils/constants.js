// // src/utils/constants.js

// // Default Image URLs
// export const DEFAULT_PRODUCT_IMAGE = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image';
// export const DEFAULT_CATEGORY_IMAGE = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image';
// export const DEFAULT_BANNER_IMAGE = 'https://dummyimage.com/1200x300';

// // Default Location (Jharia, Dhanbad)
// export const DEFAULT_LOCATION = {
//   lat: 23.7407,
//   lon: 86.4146,
// };

// // Default Delivery Radius (in kilometers)
// export const DEFAULT_DELIVERY_RADIUS = 50;

// // Supabase Table Names
// export const TABLE_NAMES = {
//   PRODUCTS: 'products',
//   CATEGORIES: 'categories',
//   PRODUCT_VARIANTS: 'product_variants',
//   CART: 'cart',
// };

// // Status Values
// export const STATUS_ACTIVE = 'active';

// // Maximum Limits
// export const MAX_PRODUCTS_HOME = 4; // Maximum products to display on Home page
// export const MAX_CATEGORIES_HOME = 20; // Maximum categories to fetch
// export const MAX_BANNERS = 100; // Maximum banners to fetch
// export const MAX_SEARCH_SUGGESTIONS = 5; // Maximum search suggestions

// // Search Debounce Delay (in milliseconds)
// export const SEARCH_DEBOUNCE_DELAY = 300;

// // Geolocation Timeout (in milliseconds)
// export const GEOLOCATION_TIMEOUT = 10000;

// // Currency Symbol
// export const CURRENCY_SYMBOL = '₹';

// // Routes
// export const ROUTES = {
//   HOME: '/',
//   AUTH: '/auth',
//   CART: '/cart',
//   CATEGORIES: '/categories',
//   PRODUCTS: '/products',
//   PRODUCT: (id) => `/product/${id}`,
// };

// // Toast Duration (in milliseconds)
// export const TOAST_DURATION = 3000;


// src/utils/constants.js
export const DEFAULT_PRODUCT_IMAGE = 'https://dummyimage.com/200x200/ccc/fff&text=No+Image';
export const DEFAULT_CATEGORY_IMAGE = 'https://dummyimage.com/150x150/ccc/fff&text=No+Image';
export const DEFAULT_BANNER_IMAGE = 'https://dummyimage.com/1200x300';
export const DEFAULT_LOCATION = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad
export const DEFAULT_ADDRESS = 'Jharia, Dhanbad, Jharkhand 828111, India';
export const EARTH_RADIUS_KM = 6371;
export const DEFAULT_DELIVERY_RADIUS = 50;
export const TABLE_NAMES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  PRODUCT_VARIANTS: 'product_variants',
  CART: 'cart',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  SELLERS: 'sellers',
  PROFILES: 'profiles',
};
export const STATUS_ACTIVE = 'active';
export const MAX_PRODUCTS_HOME = 4;
export const MAX_CATEGORIES_HOME = 20;
export const MAX_BANNERS = 100;
export const MAX_SEARCH_SUGGESTIONS = 5;
export const SEARCH_DEBOUNCE_DELAY = 300;
export const GEOLOCATION_TIMEOUT = 10000;
export const CURRENCY_SYMBOL = '₹';
export const TOAST_DURATION = 3000;
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CART: '/cart',
  CHECKOUT: '/checkout',
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  PRODUCT: (id) => `/product/${id}`,
  ACCOUNT: '/account',
  CATEGORY: (id) => `/category/${id}`,
  ORDERS: '/orders',
  ORDER_DETAILS: (orderId) => `/order-details/${orderId}`,
  MODERN_ORDER_DETAILS: (orderId) => `/modern-order-details/${orderId}`,
  CANCEL_ORDER: (id) => `/orders/cancel/${id}`,
  SELLER: '/seller',
  ADD_PRODUCT: '/seller/add-product',
  EDIT_PRODUCT: (productId) => `/edit-product/${productId}`,
  ORDER_DETAILS_DEMO: '/order-details-demo',
  PERFECT_NAVIGATION_DEMO: '/perfect-navigation-demo',
  SUPPORT: '/support',
  POLICY: '/policy',
  PRIVACY: '/privacy',
};