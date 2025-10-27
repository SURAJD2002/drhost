import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing scroll restoration and navigation state
 * Handles scroll position saving/restoring and navigation fallback logic
 */
export const useScrollRestoration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollPositions = useRef(new Map());
  const navigationStack = useRef([]);
  const isNavigatingBack = useRef(false);

  // Save scroll position for current route
  const saveScrollPosition = useCallback((pathname, scrollY) => {
    if (scrollY > 0) {
      scrollPositions.current.set(pathname, scrollY);
      // Also save to sessionStorage for persistence across page reloads
      try {
        const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        savedPositions[pathname] = scrollY;
        sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
      } catch (error) {
        console.warn('Failed to save scroll position to sessionStorage:', error);
      }
    }
  }, []);

  // Restore scroll position for given route
  const restoreScrollPosition = useCallback((pathname) => {
    // Skip scroll restoration for product pages to prevent blinking
    if (pathname.startsWith('/product/')) {
      return false;
    }

    const savedPosition = scrollPositions.current.get(pathname);
    if (savedPosition) {
      // Use requestAnimationFrame to prevent blinking
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, behavior: 'smooth' });
      });
      return true;
    }

    // Fallback to sessionStorage
    try {
      const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      const position = savedPositions[pathname];
      if (position) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: position, behavior: 'smooth' });
        });
        scrollPositions.current.set(pathname, position);
        return true;
      }
    } catch (error) {
      console.warn('Failed to restore scroll position from sessionStorage:', error);
    }

    return false;
  }, []);

  // Navigate with state tracking
  const navigateWithState = useCallback((to, options = {}) => {
    const currentPath = location.pathname;
    
    // Save current scroll position
    saveScrollPosition(currentPath, window.scrollY);
    
    // Add to navigation stack if not going back
    if (!options.replace) {
      navigationStack.current.push({
        path: currentPath,
        scrollY: window.scrollY,
        timestamp: Date.now()
      });
      
      // Limit stack size to prevent memory issues
      if (navigationStack.current.length > 50) {
        navigationStack.current = navigationStack.current.slice(-25);
      }
    }

    // Add navigation state
    const state = {
      ...options.state,
      fromRoute: currentPath,
      navigationType: 'forward'
    };

    navigate(to, { ...options, state });
  }, [location.pathname, navigate, saveScrollPosition]);

  // Determine fallback route based on current path
  const getFallbackRoute = useCallback((pathname) => {
    // Product page -> Categories (if accessed directly)
    if (pathname.startsWith('/product/')) {
      return '/categories';
    }
    
    // Category-specific routes -> Home
    if (pathname.startsWith('/products') || pathname.startsWith('/categories')) {
      return '/';
    }
    
    // Auth-related -> Home
    if (pathname === '/auth') {
      return '/';
    }
    
    // Account-related -> Home
    if (pathname.startsWith('/account') || pathname.startsWith('/orders')) {
      return '/';
    }
    
    // Seller-related -> Home
    if (pathname.startsWith('/seller')) {
      return '/';
    }
    
    // Checkout -> Cart
    if (pathname === '/checkout') {
      return '/cart';
    }
    
    return null;
  }, []);

  // Navigate back with fallback logic
  const navigateBack = useCallback(() => {
    const currentPath = location.pathname;
    
    // Save current scroll position
    saveScrollPosition(currentPath, window.scrollY);
    
    // Check if we have navigation history
    if (navigationStack.current.length > 0) {
      const previousRoute = navigationStack.current.pop();
      isNavigatingBack.current = true;
      
      // Navigate to previous route
      navigate(previousRoute.path, {
        state: {
          fromRoute: currentPath,
          navigationType: 'back',
          restoreScroll: true
        }
      });
      return true;
    }

    // Fallback logic for direct URL access
    const fallbackRoute = getFallbackRoute(currentPath);
    if (fallbackRoute) {
      isNavigatingBack.current = true;
      navigate(fallbackRoute, {
        state: {
          fromRoute: currentPath,
          navigationType: 'fallback',
          restoreScroll: true
        }
      });
      return true;
    }

    // Ultimate fallback to home
    navigate('/', {
      state: {
        fromRoute: currentPath,
        navigationType: 'home-fallback'
      }
    });
    return true;
  }, [location.pathname, navigate, saveScrollPosition, getFallbackRoute]);

  // Handle scroll restoration on route change
  useEffect(() => {
    const currentPath = location.pathname;
    const state = location.state;
    
    // Don't restore scroll for initial page load or if explicitly disabled
    if (state?.disableScrollRestore) {
      return;
    }

    // For back navigation, restore scroll position
    if (state?.restoreScroll && isNavigatingBack.current) {
      isNavigatingBack.current = false;
      
      // Use a small delay to ensure content is rendered
      const timer = setTimeout(() => {
        const restored = restoreScrollPosition(currentPath);
        if (!restored) {
          // If no saved position, scroll to top
          window.scrollTo(0, 0);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }

    // For forward navigation (including direct URL access), scroll to top
    if (!state || state.navigationType === 'forward' || !state.fromRoute) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.state, restoreScrollPosition]);

  // Save scroll position on scroll events (throttled)
  useEffect(() => {
    let timeoutId;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollPosition(location.pathname, window.scrollY);
      }, 150); // Throttle to every 150ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, saveScrollPosition]);

  // Save scroll position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition(location.pathname, window.scrollY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname, saveScrollPosition]);

  // Initialize scroll positions from sessionStorage on mount
  useEffect(() => {
    try {
      const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
      Object.entries(savedPositions).forEach(([path, position]) => {
        scrollPositions.current.set(path, position);
      });
    } catch (error) {
      console.warn('Failed to load scroll positions from sessionStorage:', error);
    }
  }, []);

  // Clear old scroll positions (older than 1 hour)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      try {
        const savedPositions = JSON.parse(sessionStorage.getItem('scrollPositions') || '{}');
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        Object.entries(savedPositions).forEach(([path, data]) => {
          // If the data includes timestamp and it's old, remove it
          if (typeof data === 'object' && data.timestamp && data.timestamp < oneHourAgo) {
            delete savedPositions[path];
            scrollPositions.current.delete(path);
          }
        });
        
        sessionStorage.setItem('scrollPositions', JSON.stringify(savedPositions));
      } catch (error) {
        console.warn('Failed to cleanup old scroll positions:', error);
      }
    }, 10 * 60 * 1000); // Run every 10 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    navigateWithState,
    navigateBack,
    saveScrollPosition,
    restoreScrollPosition,
    getFallbackRoute
  };
};

export default useScrollRestoration;
