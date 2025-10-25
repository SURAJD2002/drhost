import { useNavigate, useLocation } from 'react-router-dom';
import { useScrollRestoration } from './useScrollRestoration';

/**
 * Enhanced navigation hook that provides scroll restoration and navigation state management
 * This hook should be used by components that need navigation functionality
 */
export const useEnhancedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateWithState, navigateBack } = useScrollRestoration();


  // Enhanced back navigation with fallback logic
  const goBack = (fallbackTo = null) => {
    if (fallbackTo) {
      // If fallback is specified, navigate to it instead of using back logic
      navigateWithState(fallbackTo, { state: { navigationType: 'fallback' } });
    } else {
      // Use the enhanced back navigation with automatic fallback
      navigateBack();
    }
  };

  // Navigate to product page with proper state management
  const navigateToProduct = (productId, fromRoute = null) => {
    const state = {
      fromRoute: fromRoute || location.pathname,
      navigationType: 'product-view'
    };
    navigateWithState(`/product/${productId}`, { state });
  };

  // Navigate to category with scroll preservation
  const navigateToCategory = (categoryPath, preserveScroll = true) => {
    const state = {
      fromRoute: location.pathname,
      navigationType: 'category-navigation',
      preserveScroll
    };
    navigateWithState(categoryPath, { state });
  };

  // Navigate to cart with state tracking
  const navigateToCart = () => {
    const state = {
      fromRoute: location.pathname,
      navigationType: 'cart-navigation'
    };
    navigateWithState('/cart', { state });
  };

  // Navigate to checkout with state tracking
  const navigateToCheckout = () => {
    const state = {
      fromRoute: location.pathname,
      navigationType: 'checkout-navigation'
    };
    navigateWithState('/checkout', { state });
  };

  // Navigate to home with state tracking
  const navigateToHome = () => {
    const state = {
      fromRoute: location.pathname,
      navigationType: 'home-navigation'
    };
    navigateWithState('/', { state });
  };

  return {
    // Core navigation functions
    navigate: navigateWithState, // Use navigateWithState as the main navigate function
    goBack,
    navigateBack: goBack, // Alias for backward compatibility
    
    // Enhanced navigation functions
    navigateToProduct,
    navigateToCategory,
    navigateToCart,
    navigateToCheckout,
    navigateToHome,
    
    // Direct access to location for components that need it
    location,
    
    // Access to original navigate for special cases
    navigateDirect: navigate
  };
};

export default useEnhancedNavigation;


