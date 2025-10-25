// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useParams, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import useScrollMemory from '../hooks/useScrollMemory';
// import '../style/Products.css';

// /**
//  * CategoryPage component for displaying products in a specific category
//  * Handles scroll memory and navigation state for category → product flow
//  */
// function CategoryPage() {
//   const { categoryId } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyerLocation } = useContext(LocationContext);
  
//   // Enhanced navigation with scroll memory
//   const { navigate } = useScrollMemory();
  
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);

//   // Fetch category name and basic info
//   const fetchCategoryInfo = useCallback(async () => {
//     if (!categoryId) return;
    
//     try {
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('name, is_restricted, max_delivery_radius_km')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
        
//       if (categoryError) throw categoryError;
      
//       setCategoryName(categoryData.name);
      
//       // Check if category is restricted and user came from categories page
//       if (categoryData.is_restricted && !location.state?.fromCategories) {
//         navigate('/categories', { 
//           state: { 
//             message: `Please select the ${categoryData.name} category from the categories page to view products.` 
//           } 
//         });
//         return false;
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error fetching category info:', error);
//       setError('Failed to load category information.');
//       return false;
//     }
//   }, [categoryId, location.state, navigate]);

//   // Fetch products for the category
//   const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
//     if (!categoryId || !buyerLocation) return;
    
//     try {
//       setLoadingMore(pageNum > 1);
      
//       const { lat, lon } = buyerLocation;
//       const radiusKm = 50; // Default radius
      
//       // Build the query with location filtering
//       let query = supabase
//         .from('products')
//         .select(`
//           id, name, description, price, original_price, discount_amount, 
//           images, stock, status, category_id, seller_id, created_at,
//           categories!inner(name, is_restricted),
//           sellers!inner(latitude, longitude, store_name)
//         `)
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('status', 'active')
//         .eq('categories.is_restricted', false)
//         .order('created_at', { ascending: false })
//         .range((pageNum - 1) * 20, pageNum * 20 - 1);

//       const { data: productsData, error: productsError } = await query;
      
//       if (productsError) throw productsError;
      
//       // Filter products by distance
//       const nearbyProducts = (productsData || []).filter(product => {
//         if (!product.sellers?.latitude || !product.sellers?.longitude) return false;
        
//         const distance = calculateDistance(
//           lat, lon,
//           product.sellers.latitude,
//           product.sellers.longitude
//         );
        
//         return distance <= radiusKm;
//       });

//       if (append) {
//         setProducts(prev => [...prev, ...nearbyProducts]);
//       } else {
//         setProducts(nearbyProducts);
//       }
      
//       setHasMore(nearbyProducts.length === 20);
//       setPage(pageNum);
      
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setError('Failed to load products.');
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//     }
//   }, [categoryId, buyerLocation]);

//   // Calculate distance between two points
//   const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return R * c;
//   }, []);

//   // Handle product click with navigation state
//   const handleProductClick = useCallback((productId) => {
//     navigate(`/product/${productId}`, {
//       state: {
//         fromCategory: true,
//         categoryId: categoryId,
//         categoryName: categoryName,
//         scrollPosition: window.scrollY
//       }
//     });
//   }, [navigate, categoryId, categoryName]);

//   // Handle infinite scroll
//   const handleScroll = useCallback(() => {
//     if (loadingMore || !hasMore) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
//     if (scrollTop + clientHeight >= scrollHeight - 1000) {
//       fetchProducts(page + 1, true);
//     }
//   }, [loadingMore, hasMore, page, fetchProducts]);

//   // Initialize data
//   useEffect(() => {
//     const initializeData = async () => {
//       const categoryValid = await fetchCategoryInfo();
//       if (categoryValid) {
//         await fetchProducts(1, false);
//       }
//     };
    
//     initializeData();
//   }, [fetchCategoryInfo, fetchProducts]);

//   // Add scroll listener for infinite scroll
//   useEffect(() => {
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [handleScroll]);

//   // Handle back navigation
//   const handleBackClick = useCallback(() => {
//     navigate('/categories');
//   }, [navigate]);

//   if (loading) {
//     return (
//       <div className="prod-loading">
//         <svg className="prod-spinner" viewBox="0 0 50 50">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading {categoryName || 'Category'} Products...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="prod-error">
//         {error}
//         <div className="prod-error-actions">
//           <button onClick={handleBackClick} className="prod-retry-btn">
//             Back to Categories
//           </button>
//           <button onClick={() => navigate('/')} className="prod-back-btn">
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="prod-page">
//       <div className="prod-header">
//         <button 
//           onClick={handleBackClick}
//           className="prod-back-button"
//           aria-label="Back to categories"
//         >
//           ← Back to Categories
//         </button>
//         <h1 className="prod-title">
//           {categoryName} Products
//         </h1>
//       </div>

//       <div className="prod-grid">
//         {products.map((product) => (
//           <div
//             key={product.id}
//             className="prod-card"
//             onClick={() => handleProductClick(product.id)}
//             role="button"
//             tabIndex={0}
//             onKeyPress={(e) => e.key === 'Enter' && handleProductClick(product.id)}
//             aria-label={`View ${product.name} details`}
//           >
//             <div className="prod-image-container">
//               <img
//                 src={product.images?.[0] || 'https://dummyimage.com/200x200/ccc/fff&text=No+Image'}
//                 alt={product.name}
//                 className="prod-image"
//                 loading="lazy"
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/200x200/ccc/fff&text=No+Image';
//                 }}
//               />
//               {product.discount_amount > 0 && (
//                 <div className="prod-discount-badge">
//                   -{Math.round((product.discount_amount / product.original_price) * 100)}%
//                 </div>
//               )}
//             </div>
            
//             <div className="prod-info">
//               <h3 className="prod-name">{product.name}</h3>
//               <p className="prod-description">
//                 {product.description?.substring(0, 100)}
//                 {product.description?.length > 100 ? '...' : ''}
//               </p>
              
//               <div className="prod-price-container">
//                 <span className="prod-price">
//                   ₹{product.price?.toFixed(2) || '0.00'}
//                 </span>
//                 {product.original_price > product.price && (
//                   <span className="prod-original-price">
//                     ₹{product.original_price?.toFixed(2)}
//                   </span>
//                 )}
//               </div>
              
//               <div className="prod-meta">
//                 <span className="prod-seller">{product.sellers?.store_name || 'Unknown Seller'}</span>
//                 <span className="prod-stock">
//                   {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {loadingMore && (
//         <div className="prod-loading-more">
//           <svg className="prod-spinner" viewBox="0 0 50 50">
//             <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//           </svg>
//           Loading more products...
//         </div>
//       )}

//       {!hasMore && products.length > 0 && (
//         <div className="prod-end-message">
//           You've reached the end of {categoryName} products
//         </div>
//       )}

//       {products.length === 0 && !loading && (
//         <div className="prod-no-items">
//           <p>No products found in this category.</p>
//           <button onClick={handleBackClick} className="prod-retry-btn">
//             Back to Categories
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default CategoryPage;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useParams, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import useScrollManager from '../hooks/scrollManager'; // Corrected import
// import '../style/Products.css';

// /**
//  * CategoryPage component for displaying products in a specific category
//  * Handles scroll memory and navigation state for category → product flow
//  */
// function CategoryPage() {
//   const { categoryId } = useParams();
//   const location = useLocation();
//   const { buyerLocation } = useContext(LocationContext);
  
//   // Enhanced navigation with scroll memory
//   const { navigate } = useScrollManager();
  
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);

//   // Fetch category name and basic info
//   const fetchCategoryInfo = useCallback(async () => {
//     if (!categoryId) {
//       setError('Invalid category ID.');
//       setLoading(false);
//       return false;
//     }
    
//     try {
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('name, is_restricted, max_delivery_radius_km')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
        
//       if (categoryError) throw categoryError;
      
//       setCategoryName(categoryData.name);
      
//       // Check if category is restricted and user came from categories page
//       if (categoryData.is_restricted && !location.state?.fromCategories) {
//         navigate('/categories', {
//           state: { 
//             message: `Please select the ${categoryData.name} category from the categories page to view products.`,
//           },
//         });
//         return false;
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error fetching category info:', error);
//       setError('Failed to load category information.');
//       return false;
//     }
//   }, [categoryId, location.state, navigate]);

//   // Fetch products for the category
//   const fetchProducts = useCallback(
//     async (pageNum = 1, append = false) => {
//       if (!categoryId || !buyerLocation) {
//         setError('Missing category or location information.');
//         setLoading(false);
//         return;
//       }
    
//       try {
//         setLoadingMore(pageNum > 1);
        
//         const { lat, lon } = buyerLocation;
//         const radiusKm = 50; // Default radius
        
//         // Build the query with location filtering
//         let query = supabase
//           .from('products')
//           .select(`
//             id, name, description, price, original_price, discount_amount, 
//             images, stock, status, category_id, seller_id, created_at,
//             categories!inner(name, is_restricted),
//             sellers!inner(latitude, longitude, store_name)
//           `)
//           .eq('category_id', parseInt(categoryId, 10))
//           .eq('status', 'active')
//           .eq('categories.is_restricted', false)
//           .order('created_at', { ascending: false })
//           .range((pageNum - 1) * 20, pageNum * 20 - 1);

//         const { data: productsData, error: productsError } = await query;
        
//         if (productsError) throw productsError;
        
//         // Filter products by distance
//         const nearbyProducts = (productsData || []).filter((product) => {
//           if (!product.sellers?.latitude || !product.sellers?.longitude) return false;
          
//           const distance = calculateDistance(
//             lat,
//             lon,
//             product.sellers.latitude,
//             product.sellers.longitude,
//           );
          
//           return distance <= radiusKm;
//         });

//         if (append) {
//           setProducts((prev) => [...prev, ...nearbyProducts]);
//         } else {
//           setProducts(nearbyProducts);
//         }
        
//         setHasMore(nearbyProducts.length === 20);
//         setPage(pageNum);
//       } catch (error) {
//         console.error('Error fetching products:', error);
//         setError('Failed to load products.');
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//       }
//     },
//     [categoryId, buyerLocation],
//   );

//   // Calculate distance between two points
//   const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = ((lat2 - lat1) * Math.PI) / 180;
//     const dLon = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   }, []);

//   // Handle product click with navigation state
//   const handleProductClick = useCallback(
//     (productId) => {
//       navigate(`/product/${productId}`, {
//         state: {
//           fromCategory: true,
//           categoryId,
//           categoryName,
//           scrollPosition: window.scrollY,
//         },
//       });
//     },
//     [navigate, categoryId, categoryName],
//   );

//   // Handle infinite scroll
//   const handleScroll = useCallback(() => {
//     if (loadingMore || !hasMore) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
//     if (scrollTop + clientHeight >= scrollHeight - 1000) {
//       fetchProducts(page + 1, true);
//     }
//   }, [loadingMore, hasMore, page, fetchProducts]);

//   // Initialize data
//   useEffect(() => {
//     const initializeData = async () => {
//       const categoryValid = await fetchCategoryInfo();
//       if (categoryValid) {
//         await fetchProducts(1, false);
//       }
//     };
    
//     initializeData();
//   }, [fetchCategoryInfo, fetchProducts]);

//   // Add scroll listener for infinite scroll
//   useEffect(() => {
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [handleScroll]);

//   // Handle back navigation
//   const handleBackClick = useCallback(() => {
//     navigate('/categories');
//   }, [navigate]);

//   if (loading) {
//     return (
//       <div className="prod-loading" aria-live="polite">
//         <svg className="prod-spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading {categoryName || 'Category'} Products...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="prod-error" aria-live="assertive">
//         {error}
//         <div className="prod-error-actions">
//           <button
//             onClick={handleBackClick}
//             className="prod-retry-btn"
//             aria-label="Back to categories"
//           >
//             Back to Categories
//           </button>
//           <button
//             onClick={() => navigate('/')}
//             className="prod-back-btn"
//             aria-label="Back to home"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="prod-page">
//       <div className="prod-header">
//         <button
//           onClick={handleBackClick}
//           className="prod-back-button"
//           aria-label="Back to categories"
//         >
//           ← Back to Categories
//         </button>
//         <h1 className="prod-title">{categoryName} Products</h1>
//       </div>

//       <div className="prod-grid" role="grid">
//         {products.map((product) => (
//           <div
//             key={product.id}
//             className="prod-card"
//             onClick={() => handleProductClick(product.id)}
//             role="gridcell"
//             tabIndex={0}
//             onKeyDown={(e) => e.key === 'Enter' && handleProductClick(product.id)}
//             aria-label={`View ${product.name} details`}
//           >
//             <div className="prod-image-container">
//               <img
//                 src={product.images?.[0] || 'https://dummyimage.com/200x200/ccc/fff&text=No+Image'}
//                 alt={product.name}
//                 className="prod-image"
//                 loading="lazy"
//                 onError={(e) => {
//                   e.target.src = 'https://dummyimage.com/200x200/ccc/fff&text=No+Image';
//                 }}
//               />
//               {product.discount_amount > 0 && (
//                 <div className="prod-discount-badge">
//                   -{Math.round((product.discount_amount / product.original_price) * 100)}%
//                 </div>
//               )}
//             </div>
            
//             <div className="prod-info">
//               <h3 className="prod-name">{product.name}</h3>
//               <p className="prod-description">
//                 {product.description?.substring(0, 100)}
//                 {product.description?.length > 100 ? '...' : ''}
//               </p>
              
//               <div className="prod-price-container">
//                 <span className="prod-price">
//                   ₹{product.price?.toFixed(2) || '0.00'}
//                 </span>
//                 {product.original_price > product.price && (
//                   <span className="prod-original-price">
//                     ₹{product.original_price?.toFixed(2)}
//                   </span>
//                 )}
//               </div>
              
//               <div className="prod-meta">
//                 <span className="prod-seller">{product.sellers?.store_name || 'Unknown Seller'}</span>
//                 <span className="prod-stock">
//                   {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {loadingMore && (
//         <div className="prod-loading-more" aria-live="polite">
//           <svg className="prod-spinner" viewBox="0 0 50 50" aria-hidden="true">
//             <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//           </svg>
//           Loading more products...
//         </div>
//       )}

//       {!hasMore && products.length > 0 && (
//         <div className="prod-end-message" aria-live="polite">
//           You've reached the end of {categoryName} products
//         </div>
//       )}

//       {products.length === 0 && !loading && (
//         <div className="prod-no-items" aria-live="polite">
//           <p>No products found in this category.</p>
//           <button
//             onClick={handleBackClick}
//             className="prod-retry-btn"
//             aria-label="Back to categories"
//           >
//             Back to Categories
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(CategoryPage);


// src/components/CategoryPage.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { LocationContext } from '../App';
import { supabase } from '../supabaseClient';
import { Helmet } from 'react-helmet-async';
import { Toaster, toast } from 'react-hot-toast';
import Footer from './Footer';
import ProductCard from './ProductCard';
import { useScrollPosition, useEnhancedNavigation } from '../hooks/scrollManager'; // Correct import
import {
  DEFAULT_CATEGORY_IMAGE,
  TABLE_NAMES,
  STATUS_ACTIVE,
  ROUTES,
  TOAST_DURATION,
} from '../utils/constants';
import '../style/Categories.css';

function CategoryPage({ session, isSeller, buyerLocation }) {
  const { categoryId } = useParams();
  const location = useLocation();
  const { cartCount, setCartCount } = useContext(LocationContext);
  const { navigate } = useEnhancedNavigation();
  const { saveScrollPosition } = useScrollPosition(`/category/${categoryId}`);
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategory = useCallback(async () => {
    if (!categoryId) {
      setError('Invalid category ID.');
      setLoadingCategory(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from(TABLE_NAMES.CATEGORIES)
        .select('id, name, image_url')
        .eq('id', categoryId)
        .single();
      if (error) throw error;
      setCategory(data);
      setLoadingCategory(false);
    } catch (err) {
      setError('Failed to load category.');
      toast.error('Failed to load category', {
        duration: TOAST_DURATION,
        style: { background: '#ff4d4f', color: '#fff' },
      });
      setLoadingCategory(false);
    }
  }, [categoryId]);

  const fetchProducts = useCallback(async () => {
    if (!categoryId) {
      setError('Invalid category ID.');
      setLoadingProducts(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from(TABLE_NAMES.PRODUCTS)
        .select(`
          id, name, price, original_price, discount_amount, images, stock, 
          status, category_id, seller_id, latitude, longitude,
          sellers!inner(store_name)
        `)
        .eq('status', STATUS_ACTIVE)
        .eq('is_approved', true)
        .eq('category_id', categoryId);
      if (error) throw error;

      const filteredProducts = data.filter((product) => {
        if (!buyerLocation || !product.latitude || !product.longitude) return true;
        const distance = calculateDistance(
          buyerLocation.lat,
          buyerLocation.lon,
          product.latitude,
          product.longitude
        );
        return distance <= 50;
      });

      setProducts(filteredProducts);
      setLoadingProducts(false);
    } catch (err) {
      setError('Failed to load products.');
      toast.error('Failed to load products', {
        duration: TOAST_DURATION,
        style: { background: '#ff4d4f', color: '#fff' },
      });
      setLoadingProducts(false);
    }
  }, [categoryId, buyerLocation, calculateDistance]);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const addToCart = useCallback(
    async (product) => {
      if (!session) {
        navigate(ROUTES.AUTH, { state: { from: location.pathname } });
        return;
      }
      try {
        const { error } = await supabase
          .from(TABLE_NAMES.CART)
          .insert({ user_id: session.user.id, product_id: product.id, quantity: 1 });
        if (error) throw error;
        setCartCount(cartCount + 1);
        toast.success(`${product.name} added to cart!`, {
          duration: TOAST_DURATION,
          style: { background: '#10b981', color: '#fff' },
        });
      } catch (err) {
        toast.error('Failed to add to cart', {
          duration: TOAST_DURATION,
          style: { background: '#ff4d4f', color: '#fff' },
        });
      }
    },
    [session, cartCount, setCartCount, navigate, location.pathname]
  );

  const handleBuyNow = useCallback(
    (product) => {
      if (!session) {
        navigate(ROUTES.AUTH, { state: { from: location.pathname } });
        return;
      }
      addToCart(product).then(() => {
        navigate(ROUTES.CART, { state: { scrollPosition: saveScrollPosition() } });
      });
    },
    [session, addToCart, navigate, saveScrollPosition, location.pathname]
  );

  const handleBackClick = useCallback(() => {
    navigate(ROUTES.CATEGORIES, { state: { scrollPosition: saveScrollPosition() } });
  }, [navigate, saveScrollPosition]);

  useEffect(() => {
    fetchCategory();
    fetchProducts();
  }, [fetchCategory, fetchProducts]);

  if (loadingCategory || loadingProducts) {
    return <div>Loading...</div>;
  }

  if (error || !category) {
    return (
      <div>
        {error || 'Category not found.'}
        <button onClick={handleBackClick}>Back to Categories</button>
      </div>
    );
  }

  return (
    <div className="category-page">
      <Helmet>
        <title>{category.name} - Markeet</title>
      </Helmet>
      <Toaster />
      <button onClick={handleBackClick}>Back</button>
      <h1>{category.name}</h1>
      <img src={category.image_url || DEFAULT_CATEGORY_IMAGE} alt={category.name} />
      <div className="prod-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart}
            handleBuyNow={handleBuyNow}
          />
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default React.memo(CategoryPage);