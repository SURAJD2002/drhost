import { toast } from 'react-hot-toast';

/**
 * Unified Toast Utility for Markeet
 * Provides consistent styling and behavior across the application
 */

// Toast style configurations
export const TOAST_STYLES = {
  info: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#0b74de', // Blue info background
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      cursor: 'default', // Non-clickable cursor
    },
  },
  success: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#4caf50', // Green success background
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      cursor: 'default',
    },
  },
  warning: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#ff9800', // Orange warning background
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      cursor: 'default',
    },
  },
  error: {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#ef4444', // Red error background (only for critical errors)
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      cursor: 'default',
    },
  },
};

/**
 * Show info toast (blue) for general information
 * @param {string} message - Toast message
 * @param {object} options - Additional options
 */
export const infoToast = (message, options = {}) => {
  return toast(message, {
    ...TOAST_STYLES.info,
    ...options,
  });
};

/**
 * Show success toast (green) for successful actions
 * @param {string} message - Toast message
 * @param {object} options - Additional options
 */
export const successToast = (message, options = {}) => {
  return toast.success(message, {
    ...TOAST_STYLES.success,
    ...options,
  });
};

/**
 * Show warning toast (orange) for warnings
 * @param {string} message - Toast message
 * @param {object} options - Additional options
 */
export const warningToast = (message, options = {}) => {
  return toast(message, {
    ...TOAST_STYLES.warning,
    ...options,
  });
};

/**
 * Show error toast (red) ONLY for critical system errors
 * @param {string} message - Toast message
 * @param {object} options - Additional options
 */
export const errorToast = (message, options = {}) => {
  return toast.error(message, {
    ...TOAST_STYLES.error,
    ...options,
  });
};

/**
 * Show nearby products coming soon message
 * @param {object} options - Additional options
 */
export const nearbyProductsComingSoonToast = (options = {}) => {
  return infoToast('No nearby products yet — coming soon!', {
    duration: 3000,
    ...options,
  });
};

/**
 * Show network error toast
 * @param {string} message - Error message
 * @param {object} options - Additional options
 */
export const networkErrorToast = (message = 'Network error. Please check your connection.', options = {}) => {
  return errorToast(message, {
    duration: 5000,
    ...options,
  });
};

/**
 * Show authentication required toast
 * @param {string} action - Action that requires authentication
 * @param {object} options - Additional options
 */
export const authRequiredToast = (action = 'perform this action', options = {}) => {
  return infoToast(`Please log in to ${action}.`, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show out of stock toast
 * @param {object} options - Additional options
 */
export const outOfStockToast = (options = {}) => {
  return infoToast('Out of stock.', {
    duration: 3000,
    ...options,
  });
};

/**
 * Show invalid product toast
 * @param {object} options - Additional options
 */
export const invalidProductToast = (options = {}) => {
  return infoToast('Invalid product.', {
    duration: 3000,
    ...options,
  });
};

/**
 * Show product added to cart toast
 * @param {string} productName - Name of the product
 * @param {object} options - Additional options
 */
export const productAddedToCartToast = (productName, options = {}) => {
  return successToast(`${productName} added to cart!`, {
    duration: 2000,
    ...options,
  });
};

export const blueInfoToast = (message, options = {}) => infoToast(message, options);

const toastUtils = {
  infoToast,
  successToast,
  warningToast,
  errorToast,
  blueInfoToast,
  nearbyProductsComingSoonToast,
  networkErrorToast,
  authRequiredToast,
  outOfStockToast,
  invalidProductToast,
  productAddedToCartToast,
  TOAST_STYLES,
};

export default toastUtils;
