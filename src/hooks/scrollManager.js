// import { useCallback, useEffect, useRef, useLayoutEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// /**
//  * Global Scroll Manager
//  * Handles scroll position storage and restoration across the entire app
//  */
// class ScrollManager {
//   constructor() {
//     this.scrollPositions = new Map();
//     this.navigationHistory = [];
//     this.isRestoring = false;
//     this.pendingRestorations = new Map();
//   }

//   /**
//    * Save scroll position for a given key
//    * @param {string} key - Unique identifier for the page/route
//    * @param {number} scrollY - Scroll position to save
//    */
//   saveScrollPosition(key, scrollY) {
//     if (this.isRestoring) return;
    
//     // Only save if user has actually scrolled
//     if (scrollY > 0) {
//       this.scrollPositions.set(key, {
//         position: scrollY,
//         timestamp: Date.now()
//       });
      
//       // Clean up old entries (older than 1 hour)
//       this.cleanupOldEntries();
//     }
//   }

//   /**
//    * Get saved scroll position for a key
//    * @param {string} key - Unique identifier for the page/route
//    * @returns {number|null} - Saved scroll position or null
//    */
//   getScrollPosition(key) {
//     const saved = this.scrollPositions.get(key);
//     if (saved && Date.now() - saved.timestamp < 3600000) { // 1 hour
//       return saved.position;
//     }
//     return null;
//   }

//   /**
//    * Clear scroll position for a key
//    * @param {string} key - Unique identifier for the page/route
//    */
//   clearScrollPosition(key) {
//     this.scrollPositions.delete(key);
//   }

//   /**
//    * Add navigation entry to history
//    * @param {string} from - Source route
//    * @param {string} to - Destination route
//    * @param {Object} state - Navigation state
//    */
//   addNavigationEntry(from, to, state = {}) {
//     this.navigationHistory.push({
//       from,
//       to,
//       state,
//       timestamp: Date.now()
//     });

//     // Keep only last 50 entries
//     if (this.navigationHistory.length > 50) {
//       this.navigationHistory = this.navigationHistory.slice(-50);
//     }
//   }

//   /**
//    * Get the previous route from navigation history
//    * @param {string} currentRoute - Current route
//    * @returns {Object|null} - Previous route info or null
//    */
//   getPreviousRoute(currentRoute) {
//     // Find the most recent entry where 'to' matches current route
//     for (let i = this.navigationHistory.length - 1; i >= 0; i--) {
//       const entry = this.navigationHistory[i];
//       if (entry.to === currentRoute) {
//         return entry;
//       }
//     }
//     return null;
//   }

//   /**
//    * Restore scroll position with smooth animation
//    * @param {string} key - Unique identifier for the page/route
//    * @param {boolean} smooth - Whether to animate the scroll
//    */
//   async restoreScrollPosition(key, smooth = false) {
//     // Product pages should always start from top
//     if (key.startsWith('/product/')) {
//       window.scrollTo({ top: 0, behavior: 'auto' });
//       return;
//     }

//     const savedPosition = this.getScrollPosition(key);
//     if (savedPosition === null) {
//       // If no saved position, scroll to top
//       window.scrollTo({ top: 0, behavior: 'auto' });
//       return;
//     }

//     this.isRestoring = true;

//     // Wait for DOM to be ready
//     await new Promise(resolve => {
//       if (document.readyState === 'complete') {
//         resolve();
//       } else {
//         window.addEventListener('load', resolve, { once: true });
//       }
//     });

//     // Additional small delay to ensure content is rendered
//     await new Promise(resolve => setTimeout(resolve, 50));

//     // Restore scroll position
//     window.scrollTo({
//       top: savedPosition,
//       behavior: smooth ? 'smooth' : 'auto'
//     });

//     // Clear restoration flag after animation
//     setTimeout(() => {
//       this.isRestoring = false;
//     }, smooth ? 300 : 0);
//   }

//   /**
//    * Get fallback route for direct navigation
//    * @param {string} currentRoute - Current route
//    * @returns {string} - Fallback route
//    */
//   getFallbackRoute(currentRoute) {
//     if (currentRoute.startsWith('/product/')) {
//       return '/';
//     }
//     if (currentRoute.startsWith('/category/')) {
//       return '/';
//     }
//     if (currentRoute === '/cart') {
//       return '/';
//     }
//     if (currentRoute === '/checkout') {
//       return '/cart';
//     }
//     return '/';
//   }

//   /**
//    * Clean up old scroll position entries
//    */
//   cleanupOldEntries() {
//     const oneHourAgo = Date.now() - 3600000;
//     for (const [key, value] of this.scrollPositions.entries()) {
//       if (value.timestamp < oneHourAgo) {
//         this.scrollPositions.delete(key);
//       }
//     }
//   }

//   /**
//    * Get all stored scroll positions (for debugging)
//    */
//   getAllScrollPositions() {
//     return Object.fromEntries(this.scrollPositions);
//   }

//   /**
//    * Clear all stored data
//    */
//   clearAll() {
//     this.scrollPositions.clear();
//     this.navigationHistory = [];
//   }
// }

// // Global instance
// const scrollManager = new ScrollManager();

// /**
//  * Hook for saving scroll position
//  * @param {string} key - Unique identifier for the page/route
//  */
// export const useSaveScroll = (key) => {
//   const saveScrollRef = useRef(null);

//   useEffect(() => {
//     // Save scroll position on unmount
//     return () => {
//       if (saveScrollRef.current) {
//         clearTimeout(saveScrollRef.current);
//       }
      
//       // Debounced save to avoid too frequent saves
//       saveScrollRef.current = setTimeout(() => {
//         const scrollY = window.scrollY || window.pageYOffset;
//         scrollManager.saveScrollPosition(key, scrollY);
//       }, 100);
//     };
//   }, [key]);

//   // Save scroll position on scroll events (throttled)
//   useEffect(() => {
//     let timeoutId = null;
    
//     const handleScroll = () => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
      
//       timeoutId = setTimeout(() => {
//         if (!scrollManager.isRestoring) {
//           const scrollY = window.scrollY || window.pageYOffset;
//           scrollManager.saveScrollPosition(key, scrollY);
//         }
//       }, 150);
//     };

//     window.addEventListener('scroll', handleScroll, { passive: true });
    
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     };
//   }, [key]);

//   // Save scroll position before page unload
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       const scrollY = window.scrollY || window.pageYOffset;
//       scrollManager.saveScrollPosition(key, scrollY);
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);
    
//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [key]);
// };

// /**
//  * Hook for restoring scroll position
//  * @param {string} key - Unique identifier for the page/route
//  * @param {Object} options - Configuration options
//  */
// export const useRestoreScroll = (key, options = {}) => {
//   const {
//     smooth = false,
//     delay = 0,
//     condition = true
//   } = options;

//   const restoreTimeoutRef = useRef(null);

//   useLayoutEffect(() => {
//     if (!condition) return;

//     // Clear any pending restoration
//     if (restoreTimeoutRef.current) {
//       clearTimeout(restoreTimeoutRef.current);
//     }

//     // Product pages should always start from top immediately
//     if (key.startsWith('/product/')) {
//       window.scrollTo({ top: 0, behavior: 'auto' });
//       return;
//     }

//     // Restore scroll position for other pages
//     restoreTimeoutRef.current = setTimeout(() => {
//       scrollManager.restoreScrollPosition(key, smooth);
//     }, delay);

//     return () => {
//       if (restoreTimeoutRef.current) {
//         clearTimeout(restoreTimeoutRef.current);
//       }
//     };
//   }, [key, smooth, delay, condition]);
// };

// /**
//  * Hook for enhanced navigation with scroll management
//  */
// export const useEnhancedNavigation = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const enhancedNavigate = useCallback((to, options = {}) => {
//     const currentPath = location.pathname;
//     const currentSearch = location.search;
//     const fullCurrentPath = currentPath + currentSearch;

//     // Save current scroll position
//     const scrollY = window.scrollY || window.pageYOffset;
//     scrollManager.saveScrollPosition(fullCurrentPath, scrollY);

//     // Add navigation entry
//     scrollManager.addNavigationEntry(fullCurrentPath, to, options.state);

//     // Navigate with enhanced state
//     const enhancedState = {
//       ...options.state,
//       fromRoute: fullCurrentPath,
//       scrollMemory: true,
//       navigationType: 'forward'
//     };

//     navigate(to, {
//       ...options,
//       state: enhancedState
//     });
//   }, [navigate, location.pathname, location.search]);

//   const navigateBack = useCallback(() => {
//     const currentPath = location.pathname;
//     const currentSearch = location.search;
//     const fullCurrentPath = currentPath + currentSearch;

//     // Save current scroll position
//     const scrollY = window.scrollY || window.pageYOffset;
//     scrollManager.saveScrollPosition(fullCurrentPath, scrollY);

//     // Get previous route from history
//     const previousRoute = scrollManager.getPreviousRoute(fullCurrentPath);
    
//     if (previousRoute) {
//       // Navigate back to previous route
//       navigate(previousRoute.from, {
//         state: {
//           ...previousRoute.state,
//           fromRoute: fullCurrentPath,
//           scrollMemory: true,
//           navigationType: 'back',
//           restoreScroll: true
//         }
//       });
//     } else {
//       // Fallback navigation
//       const fallbackRoute = scrollManager.getFallbackRoute(currentPath);
//       navigate(fallbackRoute, {
//         state: {
//           fromRoute: fullCurrentPath,
//           scrollMemory: true,
//           navigationType: 'fallback'
//         }
//       });
//     }
//   }, [navigate, location.pathname, location.search]);

//   const getNavigationHistory = useCallback(() => {
//     return scrollManager.navigationHistory;
//   }, []);

//   const clearScrollData = useCallback(() => {
//     scrollManager.clearAll();
//   }, []);

//   return {
//     enhancedNavigate,
//     navigateBack,
//     getNavigationHistory,
//     clearScrollData,
//     scrollManager
//   };
// };

// /**
//  * Hook for managing scroll position with automatic key generation
//  * @param {string} customKey - Optional custom key, defaults to current route
//  */
// export const useScrollPosition = (customKey = null) => {
//   const location = useLocation();
//   const key = customKey || location.pathname + location.search;

//   useSaveScroll(key);
//   useRestoreScroll(key, { 
//     smooth: false, 
//     delay: 50,
//     condition: !location.state?.disableScrollRestore 
//   });

//   // Ensure product pages always start from top
//   useEffect(() => {
//     if (key.startsWith('/product/')) {
//       window.scrollTo({ top: 0, behavior: 'auto' });
//     }
//   }, [key]);

//   return {
//     key,
//     saveScroll: (position) => scrollManager.saveScrollPosition(key, position),
//     restoreScroll: (smooth = false) => scrollManager.restoreScrollPosition(key, smooth),
//     clearScroll: () => scrollManager.clearScrollPosition(key),
//     getScrollPosition: () => scrollManager.getScrollPosition(key)
//   };
// };

// // Export the scroll manager instance for direct access if needed
// export { scrollManager };

// const scrollManagerHooks = {
//   useSaveScroll,
//   useRestoreScroll,
//   useEnhancedNavigation,
//   useScrollPosition,
//   scrollManager
// };

// export default scrollManagerHooks;



// src/hooks/scrollManager.js
import { useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

class ScrollManager {
  constructor() {
    this.scrollPositions = new Map();
    this.navigationHistory = [];
    this.isRestoring = false;
    this.pendingRestorations = new Map();
  }

  saveScrollPosition(key, scrollY) {
    if (this.isRestoring) return;
    if (scrollY > 0) {
      this.scrollPositions.set(key, {
        position: scrollY,
        timestamp: Date.now(),
      });
      this.cleanupOldEntries();
    }
  }

  getScrollPosition(key) {
    const saved = this.scrollPositions.get(key);
    if (saved && Date.now() - saved.timestamp < 3600000) {
      return saved.position;
    }
    return null;
  }

  clearScrollPosition(key) {
    this.scrollPositions.delete(key);
  }

  addNavigationEntry(from, to, state = {}) {
    this.navigationHistory.push({
      from,
      to,
      state,
      timestamp: Date.now(),
    });
    if (this.navigationHistory.length > 50) {
      this.navigationHistory = this.navigationHistory.slice(-50);
    }
  }

  getPreviousRoute(currentRoute) {
    for (let i = this.navigationHistory.length - 1; i >= 0; i--) {
      const entry = this.navigationHistory[i];
      if (entry.to === currentRoute) {
        return entry;
      }
    }
    return null;
  }

  async restoreScrollPosition(key, smooth = false) {
    if (key.startsWith('/product/')) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const savedPosition = this.getScrollPosition(key);
    if (savedPosition === null) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    this.isRestoring = true;

    await new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    window.scrollTo({
      top: savedPosition,
      behavior: smooth ? 'smooth' : 'auto',
    });

    setTimeout(() => {
      this.isRestoring = false;
    }, smooth ? 300 : 0);
  }

  getFallbackRoute(currentRoute) {
    if (currentRoute.startsWith('/product/')) {
      return '/';
    }
    if (currentRoute.startsWith('/category/')) {
      return '/';
    }
    if (currentRoute === '/cart') {
      return '/';
    }
    if (currentRoute === '/checkout') {
      return '/cart';
    }
    return '/';
  }

  cleanupOldEntries() {
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, value] of this.scrollPositions.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.scrollPositions.delete(key);
      }
    }
  }

  getAllScrollPositions() {
    return Object.fromEntries(this.scrollPositions);
  }

  clearAll() {
    this.scrollPositions.clear();
    this.navigationHistory = [];
  }
}

const scrollManager = new ScrollManager();

export const useSaveScroll = (key) => {
  const saveScrollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveScrollRef.current) {
        clearTimeout(saveScrollRef.current);
      }
      saveScrollRef.current = setTimeout(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        scrollManager.saveScrollPosition(key, scrollY);
      }, 100);
    };
  }, [key]);

  useEffect(() => {
    let timeoutId = null;
    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (!scrollManager.isRestoring) {
          const scrollY = window.scrollY || window.pageYOffset;
          scrollManager.saveScrollPosition(key, scrollY);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [key]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      scrollManager.saveScrollPosition(key, scrollY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key]);
};

export const useRestoreScroll = (key, options = {}) => {
  const { smooth = false, delay = 0, condition = true } = options;
  const restoreTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    if (!condition) return;

    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
    }

    if (key.startsWith('/product/')) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    restoreTimeoutRef.current = setTimeout(() => {
      scrollManager.restoreScrollPosition(key, smooth);
    }, delay);

    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [key, smooth, delay, condition]);
};

export const useEnhancedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const enhancedNavigate = useCallback(
    (to, options = {}) => {
      const currentPath = location.pathname;
      const currentSearch = location.search;
      const fullCurrentPath = currentPath + currentSearch;

      const scrollY = window.scrollY || window.pageYOffset;
      scrollManager.saveScrollPosition(fullCurrentPath, scrollY);

      scrollManager.addNavigationEntry(fullCurrentPath, to, options.state);

      const enhancedState = {
        ...options.state,
        fromRoute: fullCurrentPath,
        scrollMemory: true,
        navigationType: 'forward',
      };

      navigate(to, {
        ...options,
        state: enhancedState,
      });
    },
    [navigate, location.pathname, location.search],
  );

  const navigateBack = useCallback(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullCurrentPath = currentPath + currentSearch;

    const scrollY = window.scrollY || window.pageYOffset;
    scrollManager.saveScrollPosition(fullCurrentPath, scrollY);

    const previousRoute = scrollManager.getPreviousRoute(fullCurrentPath);

    if (previousRoute) {
      navigate(previousRoute.from, {
        state: {
          ...previousRoute.state,
          fromRoute: fullCurrentPath,
          scrollMemory: true,
          navigationType: 'back',
          restoreScroll: true,
        },
      });
    } else {
      const fallbackRoute = scrollManager.getFallbackRoute(currentPath);
      navigate(fallbackRoute, {
        state: {
          fromRoute: fullCurrentPath,
          scrollMemory: true,
          navigationType: 'fallback',
        },
      });
    }
  }, [navigate, location.pathname, location.search]);

  const getNavigationHistory = useCallback(() => {
    return scrollManager.navigationHistory;
  }, []);

  const clearScrollData = useCallback(() => {
    scrollManager.clearAll();
  }, []);

  return {
    enhancedNavigate,
    navigateBack,
    getNavigationHistory,
    clearScrollData,
    scrollManager,
  };
};

export const useScrollPosition = (customKey = null) => {
  const location = useLocation();
  const key = customKey || location.pathname + location.search;

  useSaveScroll(key);
  useRestoreScroll(key, {
    smooth: false,
    delay: 50,
    condition: !location.state?.disableScrollRestore,
  });

  useEffect(() => {
    if (key.startsWith('/product/')) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [key]);

  return {
    key,
    saveScrollPosition: (position) => scrollManager.saveScrollPosition(key, position),
    restoreScroll: (smooth = false) => scrollManager.restoreScrollPosition(key, smooth),
    clearScroll: () => scrollManager.clearScrollPosition(key),
    getScrollPosition: () => scrollManager.getScrollPosition(key),
    navigateWithState: useEnhancedNavigation().enhancedNavigate, // Add navigateWithState
  };
};

export { scrollManager };

const scrollManagerHooks = {
  useSaveScroll,
  useRestoreScroll,
  useEnhancedNavigation,
  useScrollPosition,
  scrollManager,
};

export default scrollManagerHooks;