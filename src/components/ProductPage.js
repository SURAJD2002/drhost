

// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// // const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency
// const formatCurrency = (value) =>
//   `₹${(parseFloat(value) || 0).toLocaleString(CURRENCY_FORMAT, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// // RelatedProductSkeleton
// const RelatedProductSkeleton = () => (
//   <div className="related-product-card skeleton">
//     <div className="related-product-image skeleton-image" />
//     <div className="related-product-info">
//       <div className="skeleton-text skeleton-title" />
//       <div className="skeleton-text skeleton-price" />
//       <div className="skeleton-text skeleton-category" />
//     </div>
//   </div>
// );

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);

//       await fetchRelatedProducts(normalizedProduct);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, checkNetworkStatus]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         console.warn('fetchRelatedProducts: Invalid product or category_id', { product, retryCount });
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(relatedCache.current[cacheKey]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: relatedData, error: relatedError } = await supabase.rpc(
//           'get_related_products',
//           {
//             p_product_id: parseInt(product.id),
//             p_limit: 4,
//           },
//         );
//         if (relatedError) {
//           console.error('Supabase RPC error:', relatedError);
//           throw new Error(`Related products fetch error: ${relatedError.message}`);
//         }

//         const normalized = (relatedData || [])
//           .map((item) => ({
//             ...item,
//             price: parseFloat(item.price) || 0,
//             category_name: item.category_name || 'Unknown Category',
//           }))
//           .filter((item) => item.id !== product.id);
//         relatedCache.current[cacheKey] = normalized;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(normalized);
//       } catch (err) {
//         console.error('Related products fetch error:', err, { productId: product.id, retryCount });
//         if (retryCount < 2) {
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;
      
//       // Debug variantId
//       console.log('addToCart - activeVariant:', activeVariant, 'variantId:', variantId);

//       // Validate variantId
//       if (variantId !== null && !Number.isInteger(variantId)) {
//         console.error('Invalid variant_id:', variantId);
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);
          
//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           console.log('Cart query:', { user_id: userId, product_id: product.id, variant_id: variantId });

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) throw upsertError;
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) throw insertError;
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Cart error:', err);
//         toast.error(`Failed to add to cart: ${err.message}`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages],
//   );

//   useEffect(() => {
//     fetchProductAndVariants();
//   }, [fetchProductAndVariants]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   if (loading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={fetchProductAndVariants}
//             className="retry-btn"
//             aria-label="Retry loading product"
//           >
//             Retry
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => navigate('/products')}
//         className="enhanced-back-btn"
//         aria-label="Back to products"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View image ${i + 1} of ${productName} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getActiveVariant()?.original_price || product.original_price ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{formatCurrency(getActiveVariant()?.price || product.price)}</span>
//             {(getActiveVariant()?.original_price || product.original_price) && (
//               <span className="original-price">
//                 {formatCurrency(getActiveVariant()?.original_price || product.original_price)}
//               </span>
//             )}
//             {(getActiveVariant()?.discount_amount || product.discount_amount) > 0 && (
//               <span className="discount">
//                 Save {formatCurrency(getActiveVariant()?.discount_amount || product.discount_amount)}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-grid">
//             {[...Array(4)].map((_, i) => (
//               <RelatedProductSkeleton key={i} />
//             ))}
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <Link
//                 key={item.id}
//                 to={`/product/${item.id}`}
//                 className="related-product-card"
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <img
//                   src={item.images?.[0] || DEFAULT_IMAGE}
//                   alt={item.title}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="related-product-image"
//                   loading="lazy"
//                 />
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <p className="related-product-price">{formatCurrency(item.price)}</p>
//                   <p className="related-product-category">{item.category_name}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No related products available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// // const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency
// const formatCurrency = (value) =>
//   `₹${(parseFloat(value) || 0).toLocaleString(CURRENCY_FORMAT, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// // RelatedProductSkeleton
// const RelatedProductSkeleton = () => (
//   <div className="related-product-card skeleton">
//     <div className="related-product-image skeleton-image" />
//     <div className="related-product-info">
//       <div className="skeleton-text skeleton-title" />
//       <div className="skeleton-text skeleton-price" />
//       <div className="skeleton-text skeleton-category" />
//     </div>
//   </div>
// );

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyerLocation } = useContext(LocationContext);
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       setError('No buyer location available.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       // Validate delivery radius
//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude,
//         longitude: productData.sellers?.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(
//           `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//           {
//             duration: 4000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           },
//         );
//         setError('Product is not available in your area.');
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);

//       await fetchRelatedProducts(normalizedProduct);
//     } catch (err) {
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, checkNetworkStatus, buyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.name || 'Anonymous',
//       }));
//     } catch (err) {
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(relatedCache.current[cacheKey]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: relatedData, error: relatedError } = await supabase.rpc(
//           'get_related_products',
//           {
//             p_product_id: parseInt(product.id),
//             p_limit: 4,
//           },
//         );
//         if (relatedError) throw new Error(`Related products fetch error: ${relatedError.message}`);

//         const normalized = (relatedData || [])
//           .map((item) => ({
//             ...item,
//             price: parseFloat(item.price) || 0,
//             category_name: item.category_name || 'Unknown Category',
//           }))
//           .filter((item) => item.id !== product.id);
//         relatedCache.current[cacheKey] = normalized;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(normalized);
//       } catch (err) {
//         if (retryCount < 2) {
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       // Validate variantId
//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) throw upsertError;
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) throw insertError;
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         toast.error(`Failed to add to cart: ${err.message}`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages],
//   );

//   useEffect(() => {
//     fetchProductAndVariants();
//   }, [fetchProductAndVariants]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   if (loading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={fetchProductAndVariants}
//             className="retry-btn"
//             aria-label="Retry loading product"
//           >
//             Retry
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => navigate('/products')}
//         className="enhanced-back-btn"
//         aria-label="Back to products"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View image ${i + 1} of ${productName} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getActiveVariant()?.original_price || product.original_price ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{formatCurrency(getActiveVariant()?.price || product.price)}</span>
//             {(getActiveVariant()?.original_price || product.original_price) && (
//               <span className="original-price">
//                 {formatCurrency(getActiveVariant()?.original_price || product.original_price)}
//               </span>
//             )}
//             {(getActiveVariant()?.discount_amount || product.discount_amount) > 0 && (
//               <span className="discount">
//                 Save {formatCurrency(getActiveVariant()?.discount_amount || product.discount_amount)}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-grid">
//             {[...Array(4)].map((_, i) => (
//               <RelatedProductSkeleton key={i} />
//             ))}
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <Link
//                 key={item.id}
//                 to={`/product/${item.id}`}
//                 className="related-product-card"
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <img
//                   src={item.images?.[0] || DEFAULT_IMAGE}
//                   alt={item.title}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="related-product-image"
//                   loading="lazy"
//                 />
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <p className="related-product-price">{formatCurrency(item.price)}</p>
//                   <p className="related-product-category">{item.category_name}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No related products available.</p>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;


// // src/pages/ProductPage.jsx
// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// // const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency
// const formatCurrency = (value) =>
//   `₹${(parseFloat(value) || 0).toLocaleString(CURRENCY_FORMAT, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));


// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const [locationDetected, setLocationDetected] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     console.log('Retrying location detection...');
//     setLocationDetected(false);
//     setError(null);
//     setLoading(true);
    
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const detectedLocation = { lat: latitude, lon: longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationDetected(true);
//           console.log('Location detected on retry:', detectedLocation);
//           fetchProductAndVariants();
//         },
//         (error) => {
//           console.warn('Location detection failed on retry:', error);
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationDetected(true);
//           console.log('Using default location on retry (Bengaluru):', defaultLocation);
//           fetchProductAndVariants();
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationDetected(true);
//       console.log('No geolocation support, using default location on retry (Bengaluru):', defaultLocation);
//       fetchProductAndVariants();
//     }
//   }, [setBuyerLocation, fetchProductAndVariants]);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }
    
//     // Check if location is available, but don't block product loading
//     const hasLocation = buyerLocation?.lat && buyerLocation?.lon;
//     if (!hasLocation) {
//       console.warn('No buyer location available, loading product without location validation');
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       // Validate delivery radius only if location is available
//       if (hasLocation) {
//         const distance = calculateDistance(buyerLocation, {
//           latitude: productData.sellers?.latitude,
//           longitude: productData.sellers?.longitude,
//         });
//         const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//         if (distance === null || distance > effectiveRadius) {
//           toast.error(
//             `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//             {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             },
//           );
//           setError('Product is not available in your area.');
//           navigate('/products');
//           return;
//         }
//       } else {
//         console.warn('Skipping location validation - no buyer location available');
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);

//       // Related products will be fetched when location becomes available
//     } catch (err) {
//       console.error('Product fetch error:', err); // Log for debugging, not visible to users
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product. Please try again.`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, checkNetworkStatus, buyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) {
//         console.error('Reviews fetch error:', reviewsError); // Log silently
//         throw new Error('Failed to load reviews');
//       }

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err); // Log for debugging, not visible to users
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       // Check if user location is available
//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}-${buyerLocation.lat}-${buyerLocation.lon}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(relatedCache.current[cacheKey]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         console.log('Fetching related products with params:', {
//           p_limit: 10,
//           p_product_id: parseInt(product.id),
//           p_user_lat: parseFloat(buyerLocation.lat),
//           p_user_lon: parseFloat(buyerLocation.lon),
//         });

//         const { data: relatedData, error: relatedError } = await supabase.rpc(
//           'get_related_products_nearby',
//           {
//             p_limit: 10,
//             p_product_id: parseInt(product.id),
//             p_user_lat: parseFloat(buyerLocation.lat),
//             p_user_lon: parseFloat(buyerLocation.lon),
//           },
//         );

//         if (relatedError) {
//           console.error('Supabase RPC error:', relatedError);
//           throw new Error(`Related products fetch error: ${relatedError.message}`);
//         }

//         console.log('Related products response:', relatedData);

//         // Process the response data
//         const normalized = (relatedData || [])
//           .map((item) => ({
//             ...item,
//             price: parseFloat(item.price) || 0,
//             originalPrice: item.original_price ? parseFloat(item.original_price) : null,
//             discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
//             category_name: item.category_name || 'Unknown Category',
//             images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//             deliveryRadius: item.delivery_radius_km || item.max_delivery_radius_km || 40,
//             distance: item.distance_km ? parseFloat(item.distance_km) : null,
//           }))
//           .filter((item) => item.id !== product.id);

//         console.log('Normalized related products:', normalized);

//         relatedCache.current[cacheKey] = normalized;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(normalized);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       // Validate variantId
//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError); // Log silently
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) {
//               console.error('Cart update error:', upsertError); // Log silently
//               throw new Error('Failed to update cart');
//             }
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) {
//               console.error('Cart insert error:', insertError); // Log silently
//               throw new Error('Failed to add to cart');
//             }
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err); // Log silently
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages],
//   );

//   useEffect(() => {
//     // Wait for location to be available before fetching product
//     if (buyerLocation?.lat && buyerLocation?.lon) {
//       setLocationDetected(true);
//       fetchProductAndVariants();
//     } else {
//       // If no location, try to detect it
//       const detectLocation = async () => {
//         try {
//           if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//               (position) => {
//                 const { latitude, longitude } = position.coords;
//                 // Update the location context
//                 const detectedLocation = { lat: latitude, lon: longitude };
//                 setBuyerLocation(detectedLocation);
//                 setLocationDetected(true);
//                 console.log('Location detected and set:', detectedLocation);
//                 fetchProductAndVariants();
//               },
//               (error) => {
//                 console.warn('Location detection failed:', error);
//                 // Use default location (Bengaluru) as fallback
//                 const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//                 setBuyerLocation(defaultLocation);
//                 setLocationDetected(true);
//                 console.log('Using default location (Bengaluru):', defaultLocation);
//                 fetchProductAndVariants();
//               },
//               { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
//             );
//           } else {
//             // No geolocation support, use default location
//             const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//             setBuyerLocation(defaultLocation);
//             setLocationDetected(true);
//             console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//             fetchProductAndVariants();
//           }
//         } catch (err) {
//           console.warn('Location detection error:', err);
//           // Use default location as fallback
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationDetected(true);
//           console.log('Location detection error, using default location (Bengaluru):', defaultLocation);
//           fetchProductAndVariants();
//         }
//       };
      
//       detectLocation();
//     }
//   }, [fetchProductAndVariants, buyerLocation, setBuyerLocation]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   // Fetch related products when location becomes available
//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, fetchRelatedProducts]);


//   if (loading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry loading product"
//           >
//             Retry
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => navigate('/products')}
//         className="enhanced-back-btn"
//         aria-label="Back to products"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View image ${i + 1} of ${productName} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getActiveVariant()?.original_price || product.original_price ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{formatCurrency(getActiveVariant()?.price || product.price)}</span>
//             {(getActiveVariant()?.original_price || product.original_price) && (
//               <span className="original-price">
//                 {formatCurrency(getActiveVariant()?.original_price || product.original_price)}
//               </span>
//             )}
//             {(getActiveVariant()?.discount_amount || product.discount_amount) > 0 && (
//               <span className="discount">
//                 Save {formatCurrency(getActiveVariant()?.discount_amount || product.discount_amount)}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`)}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discountAmount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.originalPrice && item.originalPrice > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;






// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// // const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency
// const formatCurrency = (value) =>
//   `₹${(parseFloat(value) || 0).toLocaleString(CURRENCY_FORMAT, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
//   const maxLocationRetries = 3;

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= maxLocationRetries) {
//       if (locationRetries >= maxLocationRetries) {
//         toast.error('Maximum location detection attempts reached. Using default location (Bengaluru).', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         setLocationLoading(false);
//         setLocationRetries(0);
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);
//     console.log('Retrying location detection...', { attempt: locationRetries + 1 });

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const detectedLocation = { lat: latitude, lon: longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           console.log('Location detected on retry:', detectedLocation);
//         },
//         (error) => {
//           console.warn('Location detection failed on retry:', error);
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           console.log('Using default location on retry (Bengaluru):', defaultLocation);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: 6000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: 6000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [setBuyerLocation, locationLoading, locationRetries]);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       console.warn('No buyer location available, attempting to detect');
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude,
//         longitude: productData.sellers?.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(
//           `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//           {
//             duration: 4000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           },
//         );
//         setError('Product is not available in your area.');
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product. Please try again.`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, checkNetworkStatus, buyerLocation, retryLocationDetection]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) {
//         console.error('Reviews fetch error:', reviewsError);
//         throw new Error('Failed to load reviews');
//       }

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         // Fetch non-restricted category IDs
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(product.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Try RPC first
//         let relatedData, relatedError;
//         try {
//           ({ data: relatedData, error: relatedError } = await supabase.rpc(
//             'get_related_products_nearby',
//             {
//               p_limit: 10,
//               p_product_id: parseInt(product.id),
//               p_user_lat: parseFloat(buyerLocation.lat.toFixed(8)),
//               p_user_lon: parseFloat(buyerLocation.lon.toFixed(8)),
//             }
//           ));
//         } catch (rpcError) {
//           console.error('RPC call error:', rpcError);
//           relatedError = rpcError;
//         }

//         if (relatedError) {
//           console.warn('RPC failed, falling back to manual query:', relatedError.message);
//           // Fallback query
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', product.category_id)
//             .neq('id', product.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10);
//           if (fallbackError) throw new Error(`Fallback fetch error: ${fallbackError.message}`);
//           relatedData = fallbackData;
//         }

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Fetch category details if not included in RPC
//         const { data: categoryData, error: catDataError } = await supabase
//           .from('categories')
//           .select('id, max_delivery_radius_km')
//           .in('id', relatedData.map((item) => item.category_id));
//         if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);

//         // Normalize and filter related products
//         const normalized = relatedData
//           .map((item) => {
//             const seller = item.sellers || relatedData.find((d) => d.seller_id === item.seller_id);
//             const category = categoryData.find((c) => c.id === item.category_id);
//             const distance = seller ? calculateDistance(buyerLocation, {
//               latitude: seller.latitude,
//               longitude: seller.longitude,
//             }) : null;
//             const effectiveRadius = item.delivery_radius_km || category?.max_delivery_radius_km || 40;

//             return {
//               ...item,
//               price: parseFloat(item.price) || 0,
//               originalPrice: item.original_price ? parseFloat(item.original_price) : null,
//               discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
//               category_name: item.categories?.name || item.category_name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: effectiveRadius,
//               distance: distance !== null ? parseFloat(distance.toFixed(2)) : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === product.id) return false;
//             if (item.distance === null || item.distance > item.deliveryRadius) return false;
//             if (isCategoryRestricted && !location.state?.fromCategories) return false;
//             return true;
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) {
//               console.error('Cart update error:', upsertError);
//               throw new Error('Failed to update cart');
//             }
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) {
//               console.error('Cart insert error:', insertError);
//               throw new Error('Failed to add to cart');
//             }
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages],
//   );

//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchProductAndVariants();
//     } else if (!locationLoading) {
//       retryLocationDetection();
//     }
//   }, [buyerLocation, locationLoading, retryLocationDetection, fetchProductAndVariants]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   if (loading || locationLoading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry loading product"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => navigate('/products')}
//         className="enhanced-back-btn"
//         aria-label="Back to products"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View image ${i + 1} of ${productName} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getActiveVariant()?.original_price || product.original_price ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{formatCurrency(getActiveVariant()?.price || product.price)}</span>
//             {(getActiveVariant()?.original_price || product.original_price) && (
//               <span className="original-price">
//                 {formatCurrency(getActiveVariant()?.original_price || product.original_price)}
//               </span>
//             )}
//             {(getActiveVariant()?.discount_amount || product.discount_amount) > 0 && (
//               <span className="discount">
//                 Save {formatCurrency(getActiveVariant()?.discount_amount || product.discount_amount)}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`)}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discountAmount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.originalPrice && item.originalPrice > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;





// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import useScrollMemory from '../hooks/useScrollManager';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// // const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency using shared price utilities
// const formatCurrency = (value) => formatPrice(value);

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
  
//   // Enhanced navigation with scroll memory
//   const { navigateWithState, navigateBack } = useScrollMemory();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
//   const maxLocationRetries = 3;

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= maxLocationRetries) {
//       if (locationRetries >= maxLocationRetries) {
//         toast.error('Maximum location detection attempts reached. Using default location (Bengaluru).', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         setLocationLoading(false);
//         setLocationRetries(0);
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);
//     console.log('Retrying location detection...', { attempt: locationRetries + 1 });

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const detectedLocation = { lat: latitude, lon: longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           console.log('Location detected on retry:', detectedLocation);
//         },
//         (error) => {
//           console.warn('Location detection failed on retry:', error);
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           console.log('Using default location on retry (Bengaluru):', defaultLocation);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: 6000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: 6000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [setBuyerLocation, locationLoading, locationRetries]);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   // Get price display information using shared utilities
//   const getPriceInfo = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const item = activeVariant || product;
//       if (!item) return null;
      
//       return getPriceDisplayInfo(item);
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) {
//         console.error('Reviews fetch error:', reviewsError);
//         throw new Error('Failed to load reviews');
//       }

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       console.warn('No buyer location available, attempting to detect');
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude,
//         longitude: productData.sellers?.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(
//           `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//           {
//             duration: 4000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           },
//         );
//         setError('Product is not available in your area.');
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product. Please try again.`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, checkNetworkStatus, buyerLocation, retryLocationDetection, fetchProductReviews]);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         // Fetch non-restricted category IDs
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(product.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Try RPC first (disabled due to function signature mismatch)
//         let relatedData, relatedError;
//         // RPC function temporarily disabled - using fallback query directly
//         relatedError = new Error('RPC disabled - using fallback query');
        
//         if (relatedError) {
//           console.warn('RPC disabled, using fallback query:', relatedError.message);
//           // Fallback query
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', product.category_id)
//             .neq('id', product.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10);
//           if (fallbackError) throw new Error(`Fallback fetch error: ${fallbackError.message}`);
//           relatedData = fallbackData;
//         }

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Filter out items with undefined category_id to prevent query errors
//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
        
//         // Fetch category details only if we have valid category IDs and the RPC didn't provide max_delivery_radius_km
//         let categoryData = [];
//         if (validRelatedData.length > 0 && validRelatedData.some(item => item.max_delivery_radius_km == null)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await supabase
//             .from('categories')
//             .select('id, max_delivery_radius_km')
//             .in('id', categoryIds);
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         // Normalize and filter related products
//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || validRelatedData.find((d) => d.seller_id === item.seller_id);
//             // Use max_delivery_radius_km from RPC result if available, otherwise fetch from categoryData
//             const maxDeliveryRadius = item.max_delivery_radius_km || 
//               (categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km);
//             // Prefer server-calculated distance_km; fallback to client calculation
//             let distance = (typeof item.distance_km === 'number') ? item.distance_km : (
//               seller ? calculateDistance(buyerLocation, {
//                 latitude: seller.latitude,
//                 longitude: seller.longitude,
//               }) : null
//             );
//             if (distance !== null && distance !== undefined) {
//               distance = parseFloat(Number(distance).toFixed(2));
//             }
//             const effectiveRadius = item.delivery_radius_km || maxDeliveryRadius || 40;

//             return {
//               ...item,
//               price: parseFloat(item.price) || 0,
//               originalPrice: item.original_price ? parseFloat(item.original_price) : null,
//               discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
//               category_name: item.categories?.name || item.category_name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: effectiveRadius,
//               distance: (distance !== null && distance !== undefined) ? distance : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === product.id) return false;
//             // Use current product's delivery radius instead of related product's radius
//             const currentProductRadius = product.delivery_radius_km || 
//               (product.categories?.max_delivery_radius_km) || 40;
//             if (item.distance === null || item.distance > currentProductRadius) return false;
//             if (isCategoryRestricted && !location.state?.fromCategories) return false;
//             return true;
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) {
//               console.error('Cart update error:', upsertError);
//               throw new Error('Failed to update cart');
//             }
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) {
//               console.error('Cart insert error:', insertError);
//               throw new Error('Failed to add to cart');
//             }
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock],
//   );

//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchProductAndVariants();
//     } else if (!locationLoading) {
//       retryLocationDetection();
//     }
//   }, [buyerLocation, locationLoading, retryLocationDetection, fetchProductAndVariants]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   if (loading || locationLoading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry loading product"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => {
//           // Enhanced back navigation with scroll restoration
//           const state = location.state;
          
//           // If we came from a category page, go back to that category
//           if (state?.fromCategory && state?.categoryId) {
//             navigateWithState(`/products?category=${state.categoryId}`, {
//               state: {
//                 fromProduct: true,
//                 restoreScroll: true,
//                 scrollPosition: state.scrollPosition || 0
//               }
//             });
//           } else {
//             // Use enhanced back navigation with fallback
//             navigateBack();
//           }
//         }}
//         className="enhanced-back-btn"
//         aria-label="Back to previous page"
//       >
//         ← Back
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} - ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} - ${i + 1} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getPriceInfo()?.hasDiscount ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{getPriceInfo()?.formattedFinal}</span>
//             {getPriceInfo()?.hasDiscount && (
//               <span className="original-price">
//                 {getPriceInfo()?.formattedOriginal}
//               </span>
//             )}
//             {getPriceInfo()?.savings > 0 && (
//               <span className="discount">
//                 Save {getPriceInfo()?.formattedSavings}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} - ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`)}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discountAmount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.originalPrice && item.originalPrice > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;




// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/useEnhancedNavigation';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency using shared price utilities
// const formatCurrency = (value) => formatPrice(value);

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

//   // Enhanced navigation with scroll memory
//   const { navigate, goBack: navigateBack, navigateToCategory } = useEnhancedNavigation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isFullyLoaded, setIsFullyLoaded] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
//   const maxLocationRetries = 3;

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= maxLocationRetries) {
//       if (locationRetries >= maxLocationRetries) {
//         toast.error('Maximum location detection attempts reached. Using default location (Bengaluru).', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         setLocationLoading(false);
//         setLocationRetries(0);
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);
//     console.log('Retrying location detection...', { attempt: locationRetries + 1 });

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const detectedLocation = { lat: latitude, lon: longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           console.log('Location detected on retry:', detectedLocation);
//         },
//         (error) => {
//           console.warn('Location detection failed on retry:', error);
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           console.log('Using default location on retry (Bengaluru):', defaultLocation);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: 6000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: 6000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [setBuyerLocation, locationLoading, locationRetries]);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   // Get price display information using shared utilities
//   const getPriceInfo = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const item = activeVariant || product;
//       if (!item) return null;
      
//       return getPriceDisplayInfo(item);
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) {
//         console.error('Reviews fetch error:', reviewsError);
//         throw new Error('Failed to load reviews');
//       }

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       console.warn('No buyer location available, attempting to detect');
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude,
//         longitude: productData.sellers?.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(
//           `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//           {
//             duration: 4000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           },
//         );
//         setError('Product is not available in your area.');
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product. Please try again.`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, navigateToCategory, checkNetworkStatus, buyerLocation, retryLocationDetection, fetchProductReviews]);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         // Fetch non-restricted category IDs
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(product.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Using direct query (RPC function disabled)
//         let relatedData;
        
//         // Direct query for related products
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', product.category_id)
//             .neq('id', product.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10);
        
//         if (fallbackError) {
//           console.error('Related products query error:', fallbackError);
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }
        
//         relatedData = fallbackData;

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Filter out items with undefined category_id to prevent query errors
//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
        
//         // Fetch category details only if we have valid category IDs and the RPC didn't provide max_delivery_radius_km
//         let categoryData = [];
//         if (validRelatedData.length > 0 && validRelatedData.some(item => item.max_delivery_radius_km == null)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await supabase
//             .from('categories')
//             .select('id, max_delivery_radius_km')
//             .in('id', categoryIds);
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         // Normalize and filter related products
//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || validRelatedData.find((d) => d.seller_id === item.seller_id);
//             // Use max_delivery_radius_km from RPC result if available, otherwise fetch from categoryData
//             const maxDeliveryRadius = item.max_delivery_radius_km || 
//               (categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km);
//             // Prefer server-calculated distance_km; fallback to client calculation
//             let distance = (typeof item.distance_km === 'number') ? item.distance_km : (
//               seller ? calculateDistance(buyerLocation, {
//                 latitude: seller.latitude,
//                 longitude: seller.longitude,
//               }) : null
//             );
//             if (distance !== null && distance !== undefined) {
//               distance = parseFloat(Number(distance).toFixed(2));
//             }
//             const effectiveRadius = item.delivery_radius_km || maxDeliveryRadius || 40;

//             return {
//               ...item,
//               price: parseFloat(item.price) || 0,
//               originalPrice: item.original_price ? parseFloat(item.original_price) : null,
//               discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
//               category_name: item.categories?.name || item.category_name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: effectiveRadius,
//               distance: (distance !== null && distance !== undefined) ? distance : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === product.id) return false;
//             // Use current product's delivery radius instead of related product's radius
//             const currentProductRadius = product.delivery_radius_km || 
//               (product.categories?.max_delivery_radius_km) || 40;
//             if (item.distance === null || item.distance > currentProductRadius) return false;
//             if (isCategoryRestricted && !location.state?.fromCategories) return false;
//             return true;
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) {
//               console.error('Cart update error:', upsertError);
//               throw new Error('Failed to update cart');
//             }
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) {
//               console.error('Cart insert error:', insertError);
//               throw new Error('Failed to add to cart');
//             }
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock],
//   );

//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//         fetchProductAndVariants();
//       } else if (!locationLoading) {
//         retryLocationDetection();
//       }
//     }, 100); // Small delay to prevent rapid state changes

//     return () => clearTimeout(timeoutId);
//   }, [buyerLocation, locationLoading, retryLocationDetection, fetchProductAndVariants]);

//   // Prevent blinking by ensuring component is fully initialized
//   useEffect(() => {
//     const initTimeout = setTimeout(() => {
//       setIsInitialized(true);
//     }, 200); // Ensure component is stable before showing content

//     return () => clearTimeout(initTimeout);
//   }, []);

//   // Only show content when everything is fully loaded
//   useEffect(() => {
//     if (product && !loading && !locationLoading && isInitialized && !error) {
//       const finalTimeout = setTimeout(() => {
//         setIsFullyLoaded(true);
//       }, 300); // Additional delay to ensure everything is stable

//       return () => clearTimeout(finalTimeout);
//     }
//   }, [product, loading, locationLoading, isInitialized, error]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   if (loading || locationLoading || !isInitialized) {
//     return (
//       <div className="loading" role="status" aria-live="polite" style={{ minHeight: '100vh' }}>
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry loading product"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => {
//           // Enhanced back navigation with scroll restoration
//           const state = location.state;
          
//           // If we came from a category page, go back to that category
//           if (state?.fromCategory && state?.categoryId) {
//             navigateToCategory(`/products?category=${state.categoryId}`, true);
//           } else {
//             // Use enhanced back navigation with fallback
//             navigateBack();
//           }
//         }}
//         className="enhanced-back-btn"
//         aria-label="Back to previous page"
//       >
//         ← Back
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} - ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} - ${i + 1} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getPriceInfo()?.hasDiscount ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{getPriceInfo()?.formattedFinal}</span>
//             {getPriceInfo()?.hasDiscount && (
//               <span className="original-price">
//                 {getPriceInfo()?.formattedOriginal}
//               </span>
//             )}
//             {getPriceInfo()?.savings > 0 && (
//               <span className="discount">
//                 Save {getPriceInfo()?.formattedSavings}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${typeof v.attributes === 'object' 
//                       ? Object.entries(v.attributes || {})
//                           .filter(([key, val]) => val && val.toString().trim())
//                           .map(([key, val]) => `${key}: ${val}`)
//                           .join(', ')
//                       : v.attributes || 'Default'}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {typeof v.attributes === 'object' 
//                       ? Object.entries(v.attributes || {})
//                           .filter(([key, val]) => val && val.toString().trim())
//                           .map(([key, val]) => `${key}: ${val}`)
//                           .join(', ')
//                       : v.attributes || 'Default'}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} - ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discountAmount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.originalPrice && item.originalPrice > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { toast, Toaster } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/useEnhancedNavigation';
// import { Helmet } from 'react-helmet-async';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';
// import '../style/ProductPage.css';
// import icon from '../assets/icon.png';

// // Constants
// const TOAST_DURATION = 4000;
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const MAX_LOCATION_RETRIES = 3;
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility Functions
// const formatCurrency = (value) => formatPrice(value);

// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return parseFloat((R * c).toFixed(2));
// };

// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       if (i === maxRetries - 1) throw err;
//       await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//     }
//   }
// };

// // StarRatingDisplay Component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
//   const { navigate, goBack: navigateBack, navigateToCategory } = useEnhancedNavigation();

//   // State management
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem('cart')) || [];
//     } catch (err) {
//       console.error('Failed to parse cart from localStorage:', err);
//       return [];
//     }
//   });
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef((() => {
//     try {
//       return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
//     } catch (err) {
//       console.error('Failed to parse relatedCache from localStorage:', err);
//       return {};
//     }
//   })());

//   // Stable callbacks and memos
//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= MAX_LOCATION_RETRIES) {
//       if (locationRetries >= MAX_LOCATION_RETRIES) {
//         const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//         setBuyerLocation(defaultLocation);
//         setLocationLoading(false);
//         setLocationRetries(0);
//         try {
//           localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//         } catch (err) {
//           console.error('Failed to save buyerLocation to localStorage:', err);
//         }
//         toast.error('Maximum location attempts reached. Using default location (Bengaluru).', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//           setBuyerLocation(newLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(newLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//         },
//         (error) => {
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       try {
//         localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//       } catch (err) {
//         console.error('Failed to save buyerLocation to localStorage:', err);
//       }
//     }
//   }, [locationLoading, locationRetries, setBuyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await withRetry(() =>
//         supabase
//           .from('reviews')
//           .select(`
//             id, rating, review_text, reply_text, created_at,
//             profiles!reviews_reviewer_id_fkey(full_name)
//           `)
//           .eq('product_id', productId)
//           .order('created_at', { ascending: false })
//       );
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(
//     async (currentId, currentLocation) => {
//       if (!currentId || isNaN(parseInt(currentId, 10))) {
//         setError('Invalid product ID.');
//         setLoading(false);
//         toast.error('Invalid product ID.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/products');
//         return;
//       }

//       if (!checkNetworkStatus()) {
//         setError('No internet connection.');
//         setLoading(false);
//         return;
//       }

//       if (!currentLocation?.lat || !currentLocation?.lon) {
//         retryLocationDetection();
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       try {
//         const { data: productData, error: productError } = await withRetry(() =>
//           supabase
//             .from('products')
//             .select(`
//               id, title, description, price, original_price, discount_amount, images, stock, status,
//               delivery_radius_km, latitude, longitude, specifications, seller_id,
//               sellers(id, store_name, latitude, longitude),
//               categories(id, name, is_restricted, max_delivery_radius_km)
//             `)
//             .eq('id', parseInt(currentId, 10))
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .maybeSingle()
//         );
//         if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//         if (!productData) {
//           throw new Error('Product not found.');
//         }

//         const distance = calculateDistance(currentLocation, {
//           latitude: productData.sellers?.latitude || productData.latitude,
//           longitude: productData.sellers?.longitude || productData.longitude,
//         });
//         const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//         if (distance === null || distance > effectiveRadius) {
//           setError(`Product not available in your area (${distance?.toFixed(2) || 'unknown'} km > ${effectiveRadius} km).`);
//           toast.error(`Product not available in your area.`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//           navigate('/products');
//           return;
//         }

//         if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//           setError('Please access this restricted category via the Categories page.');
//           toast.error('Please access this restricted category via the Categories page.', {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//           navigateToCategory('/categories');
//           return;
//         }

//         const normalizedProduct = {
//           ...productData,
//           price: parseFloat(productData.price) || parseFloat(productData.original_price - (productData.discount_amount || 0)) || 0,
//           original_price: parseFloat(productData.original_price) || null,
//           discount_amount: parseFloat(productData.discount_amount) || 0,
//           category_name: productData.categories?.name || 'Unknown Category',
//           category_id: productData.categories?.id || null,
//           images: Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean),
//         };
//         setProduct(normalizedProduct);
//         setIsRestricted(productData.categories?.is_restricted || false);

//         const { data: variantData, error: variantError } = await withRetry(() =>
//           supabase
//             .from('product_variants')
//             .select('id, product_id, price, original_price, discount_amount, stock, attributes, images, status')
//             .eq('product_id', parseInt(currentId, 10))
//             .eq('status', 'active')
//         );
//         if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//         const validVariants = (variantData || [])
//           .map((variant) => ({
//             ...variant,
//             price: parseFloat(variant.price) || 0,
//             original_price: parseFloat(variant.original_price) || null,
//             discount_amount: parseFloat(variant.discount_amount) || 0,
//             stock: variant.stock ?? 0,
//             images: Array.isArray(variant.images) ? variant.images : [variant.images].filter(Boolean) || normalizedProduct.images,
//           }))
//           .filter((variant) => {
//             const attributes = variant.attributes || {};
//             return Object.values(attributes).some((val) => val && val.toString().trim());
//           });
//         setVariants(validVariants);
//         setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//         const reviewsData = await fetchProductReviews(parseInt(currentId, 10));
//         setReviews(reviewsData);
//       } catch (err) {
//         console.error('Product fetch error:', err);
//         setError(err.message || 'Failed to load product.');
//         toast.error(err.message || 'Failed to load product.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setLoading(false);
//       }
//     },
//     [checkNetworkStatus, retryLocationDetection, fetchProductReviews, navigate, navigateToCategory, location.state]
//   );

//   const fetchRelatedProducts = useCallback(
//     async (currentProduct) => {
//       if (!currentProduct?.id || !currentProduct.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${currentProduct.id}-${currentProduct.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;

//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: nonRestrictedCategories, error: categoryError } = await withRetry(() =>
//           supabase.from('categories').select('id').eq('is_restricted', false)
//         );
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(currentProduct.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const { data: relatedData, error: relatedError } = await withRetry(() =>
//           supabase
//             .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', currentProduct.category_id)
//             .neq('id', currentProduct.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10)
//         );
//         if (relatedError) throw new Error(`Related products fetch error: ${relatedError.message}`);

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
//         let categoryData = [];
//         if (validRelatedData.some((item) => !item.categories?.max_delivery_radius_km)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await withRetry(() =>
//             supabase.from('categories').select('id, max_delivery_radius_km').in('id', categoryIds)
//           );
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || {};
//             const maxDeliveryRadius =
//               item.categories?.max_delivery_radius_km ||
//               categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km ||
//               40;
//             const distance = calculateDistance(buyerLocation, {
//               latitude: seller.latitude || item.latitude,
//               longitude: seller.longitude || item.longitude,
//             });
//             return {
//               ...item,
//               price: parseFloat(item.price) || parseFloat(item.original_price - (item.discount_amount || 0)) || 0,
//               original_price: parseFloat(item.original_price) || null,
//               discount_amount: parseFloat(item.discount_amount) || 0,
//               category_name: item.categories?.name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: maxDeliveryRadius,
//               distance: distance != null ? parseFloat(distance.toFixed(2)) : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === currentProduct.id) return false;
//             const effectiveRadius = currentProduct.delivery_radius_km || currentProduct.categories?.max_delivery_radius_km || 40;
//             return item.distance != null && item.distance <= effectiveRadius && !(isCategoryRestricted && !location.state?.fromCategories);
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         try {
//           localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         } catch (err) {
//           console.error('Failed to save relatedCache to localStorage:', err);
//         }
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         toast.error('Unable to load related products.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setRelatedProducts([]);
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation?.lat, buyerLocation?.lon, location.state]
//   );


//   const handleImageClick = useCallback((index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages;
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   }, [getDisplayedImages]);

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') handleCloseFullScreen();
//       else if (e.key === 'ArrowLeft') fullScreenSliderRef.current?.slickPrev();
//       else if (e.key === 'ArrowRight') fullScreenSliderRef.current?.slickNext();
//     },
//     [isFullScreenOpen, handleCloseFullScreen]
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock) {
//         toast.error(isOutOfStock ? 'This item is out of stock.' : 'Product not available.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant;
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId != null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages,
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId != null) query = query.eq('variant_id', variantId);
//           else query = query.is('variant_id', null);

//           const { data: existingCartItem, error: fetchError } = await withRetry(() => query.maybeSingle());
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: TOAST_DURATION,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await withRetry(() =>
//               supabase
//                 .from('cart')
//                 .update({ quantity: newQuantity })
//                 .eq('id', existingCartItem.id)
//                 .select()
//                 .single()
//             );
//             if (upsertError) throw new Error('Failed to update cart');
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await withRetry(() =>
//               supabase
//                 .from('cart')
//                 .insert({
//                   user_id: userId,
//                   product_id: product.id,
//                   variant_id: variantId,
//                   quantity: 1,
//                   price: cartItem.price,
//                   title: cartItem.title,
//                 })
//                 .select()
//                 .single()
//             );
//             if (insertError) throw new Error('Failed to add to cart');
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex((item) => item.uniqueKey === cartItem.uniqueKey);
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }

//         setCart(updatedCart);
//         try {
//           localStorage.setItem('cart', JSON.stringify(updatedCart));
//         } catch (err) {
//           console.error('Failed to save cart to localStorage:', err);
//         }
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock]
//   );

//   // Effects
//   // 1. Initialize location (runs once on mount)
//   useEffect(() => {
//     try {
//       const storedLocation = JSON.parse(localStorage.getItem('buyerLocation'));
//       if (storedLocation?.lat && storedLocation?.lon) {
//         setBuyerLocation(storedLocation);
//       } else {
//         retryLocationDetection();
//       }
//     } catch (err) {
//       console.error('Failed to parse buyerLocation from localStorage:', err);
//       retryLocationDetection();
//     }
//   }, [setBuyerLocation, retryLocationDetection]);

//   // 2. Fetch product and variants (runs when id or location coordinates change)
//   useEffect(() => {
//     if (!id || !buyerLocation?.lat || !buyerLocation?.lon || locationLoading) {
//       return;
//     }
//     fetchProductAndVariants(id, buyerLocation);
//   }, [id, buyerLocation?.lat, buyerLocation?.lon, locationLoading, fetchProductAndVariants]);

//   // 3. Fetch related products (runs when product or location changes)
//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product?.id, buyerLocation?.lat, buyerLocation?.lon, locationLoading, fetchRelatedProducts]);

//   // 4. Keyboard event listener
//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   // All hooks must be called before any early returns
//   const getActiveVariant = useMemo(
//     () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex]
//   );

//   const getDisplayedImages = useMemo(() => {
//     const productImages = product?.images || [];
//     const variantImages = getActiveVariant?.images || [];
//     return variantImages.length > 0 ? variantImages : productImages;
//   }, [product?.images, getActiveVariant]);

//   const isOutOfStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock <= 0;
//   }, [product?.stock, getActiveVariant]);

//   const isLowStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock > 0 && stock < 5;
//   }, [product?.stock, getActiveVariant]);

//   const getPriceInfo = useMemo(() => {
//     const item = getActiveVariant || product;
//     return item ? getPriceDisplayInfo(item) : null;
//   }, [product, getActiveVariant]);

//   const averageRating = useMemo(() => {
//     return reviews.length > 0
//       ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//       : 0;
//   }, [reviews]);

//   const variantAttributes = useMemo(() =>
//     variants
//       .map((v, index) => ({
//         id: v.id,
//         index,
//         attributes: Object.entries(v.attributes || {})
//           .filter(([key, val]) => val && val.toString().trim() && key !== 'attribute1')
//           .map(([key, val]) => `${key}: ${val}`)
//           .join(', '),
//       }))
//       .filter((v) => v.attributes),
//     [variants]
//   );

//   // Render
//   if (loading || locationLoading) {
//     return (
//       <div className="loading" role="status" aria-live="polite" style={{ minHeight: '100vh' }}>
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading product...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry location detection"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages;
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => {
//           const state = location.state;
//           if (state?.fromCategory && state?.categoryId) {
//             navigateToCategory(`/products?category=${state.categoryId}`, true);
//           } else {
//             navigateBack();
//           }
//         }}
//         className="enhanced-back-btn"
//         aria-label="Back to previous page"
//       >
//         ← Back
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} ${i + 1} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div className={`price-section ${getPriceInfo?.hasDiscount ? 'offer-highlight' : ''}`}>
//             <span className="current-price">{getPriceInfo?.formattedFinal}</span>
//             {getPriceInfo?.hasDiscount && (
//               <>
//                 <span className="original-price">{getPriceInfo?.formattedOriginal}</span>
//                 <span className="discount">Save {getPriceInfo?.formattedSavings}</span>
//               </>
//             )}
//           </div>
//           {isLowStock && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant?.stock || product.stock} left in stock.
//             </p>
//           )}
//           {isOutOfStock && (
//             <p className="out-of-stock-warning" aria-live="polite">
//               Out of stock
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div role="radiogroup" aria-labelledby="variant-section-label" className="variant-options">
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes || 'Default'}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes || 'Default'}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || product.seller_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || product.seller_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} wheel={{ step: 0.1 }} pinch={{ step: 5 }}>
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button className="zoom-btn" onClick={() => resetTransform()} aria-label="Reset zoom">
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && <p className="review-reply">Seller Reply: {review.reply_text}</p>}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discount_amount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discount_amount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.original_price && item.original_price > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.original_price)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance != null && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img src={icon} alt="Markeet Logo" className="product-icon" />
//     </div>
//   );
// }

// export default ProductPage;




// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { toast, Toaster } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/useEnhancedNavigation';
// import { Helmet } from 'react-helmet-async';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';
// import '../style/ProductPage.css';
// import icon from '../assets/icon.png';

// // Constants
// const TOAST_DURATION = 4000;
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const MAX_LOCATION_RETRIES = 3;
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility Functions
// const formatCurrency = (value) => formatPrice(value);

// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return parseFloat((R * c).toFixed(2));
// };

// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (err) {
//       if (i === maxRetries - 1) throw err;
//       await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//     }
//   }
// };

// // StarRatingDisplay Component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
//   const { navigate, goBack: navigateBack, navigateToCategory } = useEnhancedNavigation();

//   // State management
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem('cart')) || [];
//     } catch (err) {
//       console.error('Failed to parse cart from localStorage:', err);
//       return [];
//     }
//   });
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef((() => {
//     try {
//       return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
//     } catch (err) {
//       console.error('Failed to parse relatedCache from localStorage:', err);
//       return {};
//     }
//   })());

//   // Stable callbacks and memos
//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= MAX_LOCATION_RETRIES) {
//       if (locationRetries >= MAX_LOCATION_RETRIES) {
//         const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//         setBuyerLocation(defaultLocation);
//         setLocationLoading(false);
//         setLocationRetries(0);
//         try {
//           localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//         } catch (err) {
//           console.error('Failed to save buyerLocation to localStorage:', err);
//         }
//         toast.error('Maximum location attempts reached. Using default location (Bengaluru).', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const newLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//           setBuyerLocation(newLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(newLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//         },
//         (error) => {
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       try {
//         localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//       } catch (err) {
//         console.error('Failed to save buyerLocation to localStorage:', err);
//       }
//     }
//   }, [locationLoading, locationRetries, setBuyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await withRetry(() =>
//         supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//           .order('created_at', { ascending: false })
//       );
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(
//     async (currentId, currentLocation) => {
//       if (!currentId || isNaN(parseInt(currentId, 10))) {
//         setError('Invalid product ID.');
//         setLoading(false);
//         toast.error('Invalid product ID.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/products');
//         return;
//       }

//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//       if (!currentLocation?.lat || !currentLocation?.lon) {
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//         const { data: productData, error: productError } = await withRetry(() =>
//           supabase
//         .from('products')
//         .select(`
//               id, title, description, price, original_price, discount_amount, images, stock, status,
//               delivery_radius_km, latitude, longitude, specifications, seller_id,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//             .eq('id', parseInt(currentId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//             .maybeSingle()
//         );
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//           throw new Error('Product not found.');
//         }

//         const distance = calculateDistance(currentLocation, {
//           latitude: productData.sellers?.latitude || productData.latitude,
//           longitude: productData.sellers?.longitude || productData.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//           setError(`Product not available in your area (${distance?.toFixed(2) || 'unknown'} km > ${effectiveRadius} km).`);
//           toast.error(`Product not available in your area.`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//           navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//           setError('Please access this restricted category via the Categories page.');
//         toast.error('Please access this restricted category via the Categories page.', {
//             duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//           price: parseFloat(productData.price) || parseFloat(productData.original_price - (productData.discount_amount || 0)) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//           images: Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean),
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//         const { data: variantData, error: variantError } = await withRetry(() =>
//           supabase
//         .from('product_variants')
//             .select('id, product_id, price, original_price, discount_amount, stock, attributes, images, status')
//             .eq('product_id', parseInt(currentId, 10))
//             .eq('status', 'active')
//         );
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//             images: Array.isArray(variant.images) ? variant.images : [variant.images].filter(Boolean) || normalizedProduct.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//             return Object.values(attributes).some((val) => val && val.toString().trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//         const reviewsData = await fetchProductReviews(parseInt(currentId, 10));
//       setReviews(reviewsData);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//         setError(err.message || 'Failed to load product.');
//         toast.error(err.message || 'Failed to load product.', {
//           duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//     },
//     [checkNetworkStatus, retryLocationDetection, fetchProductReviews, navigate, navigateToCategory, location.state]
//   );

//   const fetchRelatedProducts = useCallback(
//     async (currentProduct) => {
//       if (!currentProduct?.id || !currentProduct.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${currentProduct.id}-${currentProduct.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;

//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: nonRestrictedCategories, error: categoryError } = await withRetry(() =>
//           supabase.from('categories').select('id').eq('is_restricted', false)
//         );
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(currentProduct.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const { data: relatedData, error: relatedError } = await withRetry(() =>
//           supabase
//             .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', currentProduct.category_id)
//             .neq('id', currentProduct.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10)
//         );
//         if (relatedError) throw new Error(`Related products fetch error: ${relatedError.message}`);

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
//         let categoryData = [];
//         if (validRelatedData.some((item) => !item.categories?.max_delivery_radius_km)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await withRetry(() =>
//             supabase.from('categories').select('id, max_delivery_radius_km').in('id', categoryIds)
//           );
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || {};
//             const maxDeliveryRadius =
//               item.categories?.max_delivery_radius_km ||
//               categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km ||
//               40;
//             const distance = calculateDistance(buyerLocation, {
//               latitude: seller.latitude || item.latitude,
//               longitude: seller.longitude || item.longitude,
//             });
//             return {
//               ...item,
//               price: parseFloat(item.price) || parseFloat(item.original_price - (item.discount_amount || 0)) || 0,
//               original_price: parseFloat(item.original_price) || null,
//               discount_amount: parseFloat(item.discount_amount) || 0,
//               category_name: item.categories?.name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: maxDeliveryRadius,
//               distance: distance != null ? parseFloat(distance.toFixed(2)) : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === currentProduct.id) return false;
//             const effectiveRadius = currentProduct.delivery_radius_km || currentProduct.categories?.max_delivery_radius_km || 40;
//             return item.distance != null && item.distance <= effectiveRadius && !(isCategoryRestricted && !location.state?.fromCategories);
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         try {
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         } catch (err) {
//           console.error('Failed to save relatedCache to localStorage:', err);
//         }
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         toast.error('Unable to load related products.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setRelatedProducts([]);
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state]
//   );

//   const getActiveVariant = useMemo(
//     () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex]
//   );

//   const getDisplayedImages = useMemo(() => {
//     const productImages = product?.images || [];
//     const variantImages = getActiveVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//   }, [product?.images, getActiveVariant]);

//   const isOutOfStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock <= 0;
//   }, [product?.stock, getActiveVariant]);

//   const isLowStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock > 0 && stock < 5;
//   }, [product?.stock, getActiveVariant]);

//   const getPriceInfo = useMemo(() => {
//     const item = getActiveVariant || product;
//     return item ? getPriceDisplayInfo(item) : null;
//   }, [product, getActiveVariant]);

//   const averageRating = useMemo(() => {
//     return reviews.length > 0
//       ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//       : 0;
//   }, [reviews]);

//   const variantAttributes = useMemo(() =>
//     variants
//       .map((v, index) => ({
//         id: v.id,
//         index,
//         attributes: Object.entries(v.attributes || {})
//           .filter(([key, val]) => val && val.toString().trim() && key !== 'attribute1')
//           .map(([key, val]) => `${key}: ${val}`)
//           .join(', '),
//       }))
//       .filter((v) => v.attributes),
//     [variants]
//   );

//   const handleImageClick = useCallback((index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages;
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//   }, [getDisplayedImages]);

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') handleCloseFullScreen();
//       else if (e.key === 'ArrowLeft') fullScreenSliderRef.current?.slickPrev();
//       else if (e.key === 'ArrowRight') fullScreenSliderRef.current?.slickNext();
//     },
//     [isFullScreenOpen, handleCloseFullScreen]
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock) {
//         toast.error(isOutOfStock ? 'This item is out of stock.' : 'Product not available.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant;
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId != null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages,
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId != null) query = query.eq('variant_id', variantId);
//           else query = query.is('variant_id', null);

//           const { data: existingCartItem, error: fetchError } = await withRetry(() => query.maybeSingle());
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: TOAST_DURATION,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await withRetry(() =>
//               supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//                 .single()
//             );
//             if (upsertError) throw new Error('Failed to update cart');
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await withRetry(() =>
//               supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//                 .single()
//             );
//             if (insertError) throw new Error('Failed to add to cart');
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex((item) => item.uniqueKey === cartItem.uniqueKey);
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }

//         setCart(updatedCart);
//         try {
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         } catch (err) {
//           console.error('Failed to save cart to localStorage:', err);
//         }
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock]
//   );

//   // Effects
//   // 1. Initialize location (runs once on mount)
//   useEffect(() => {
//     try {
//       const storedLocation = JSON.parse(localStorage.getItem('buyerLocation'));
//       if (storedLocation?.lat && storedLocation?.lon) {
//         setBuyerLocation(storedLocation);
//       } else {
//       retryLocationDetection();
//     }
//     } catch (err) {
//       console.error('Failed to parse buyerLocation from localStorage:', err);
//       retryLocationDetection();
//     }
//   }, [setBuyerLocation, retryLocationDetection]);

//   // 2. Fetch product and variants (runs when id or location coordinates change)
//   useEffect(() => {
//     if (!id || !buyerLocation?.lat || !buyerLocation?.lon || locationLoading) {
//       return;
//     }
//     fetchProductAndVariants(id, buyerLocation);
//   }, [id, buyerLocation, locationLoading, fetchProductAndVariants]);

//   // 3. Fetch related products (runs when product or location changes)
//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   // 4. Keyboard event listener
//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   // Render
//   if (loading || locationLoading) {
//     return (
//       <div className="loading" role="status" aria-live="polite" style={{ minHeight: '100vh' }}>
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading product...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry location detection"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages;
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => {
//           const state = location.state;
//           if (state?.fromCategory && state?.categoryId) {
//             navigateToCategory(`/products?category=${state.categoryId}`, true);
//           } else {
//             navigateBack();
//           }
//         }}
//         className="enhanced-back-btn"
//         aria-label="Back to previous page"
//       >
//         ← Back
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} ${i + 1} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div className={`price-section ${getPriceInfo?.hasDiscount ? 'offer-highlight' : ''}`}>
//             <span className="current-price">{getPriceInfo?.formattedFinal}</span>
//             {getPriceInfo?.hasDiscount && (
//               <>
//                 <span className="original-price">{getPriceInfo?.formattedOriginal}</span>
//                 <span className="discount">Save {getPriceInfo?.formattedSavings}</span>
//               </>
//             )}
//           </div>
//           {isLowStock && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant?.stock || product.stock} left in stock.
//             </p>
//           )}
//           {isOutOfStock && (
//             <p className="out-of-stock-warning" aria-live="polite">
//               Out of stock
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div role="radiogroup" aria-labelledby="variant-section-label" className="variant-options">
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes || 'Default'}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes || 'Default'}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || product.seller_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || product.seller_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} wheel={{ step: 0.1 }} pinch={{ step: 5 }}>
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button className="zoom-btn" onClick={() => resetTransform()} aria-label="Reset zoom">
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && <p className="review-reply">Seller Reply: {review.reply_text}</p>}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discount_amount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discount_amount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.original_price && item.original_price > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.original_price)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance != null && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img src={icon} alt="Markeet Logo" className="product-icon" />
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { Toaster, toast } from 'react-hot-toast';
// import CheckoutButton from './CheckoutButton';
// import Footer from './Footer';
// import { useEnhancedNavigation } from '../hooks/useEnhancedNavigation';
// import { Helmet } from 'react-helmet-async';
// import '../style/ProductPage.css';
// import { errorToast, successToast, infoToast } from '../utils/toastUtils';
// import {
//   DEFAULT_PRODUCT_IMAGE,
//   CURRENCY_SYMBOL,
//   TABLE_NAMES,
//   STATUS_ACTIVE,
//   TOAST_DURATION,
//   ROUTES,
//   DEFAULT_DELIVERY_RADIUS,
// } from '../utils/constants';

// // Error Boundary Component
// class ErrorBoundary extends React.Component {
//   state = { hasError: false, error: null };

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="prod-error-container">
//           <h2>Something went wrong</h2>
//           <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="prod-retry-btn"
//             aria-label="Retry loading page"
//           >
//             Retry
//           </button>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// const ProductPage = () => {
//   const { id: productId } = useParams();
//   const { buyerLocation } = useContext(LocationContext);
//   const { navigate } = useEnhancedNavigation();
//   const location = useLocation();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [customerDetails, setCustomerDetails] = useState({
//     name: '',
//     email: '',
//     contact: '',
//   });

//   const MIN_LOADING_DURATION = 500; // Minimum loading duration to prevent flicker

//   // Calculate distance using Haversine formula (copied from Home.js)
//   const calculateDistance = useCallback((userLoc, productLoc) => {
//     if (
//       !userLoc ||
//       !productLoc ||
//       !productLoc.latitude ||
//       !productLoc.longitude ||
//       productLoc.latitude === 0 ||
//       productLoc.longitude === 0
//     ) {
//       console.log('Invalid location data:', { userLoc, productLoc });
//       return null;
//     }
//     const R = 6371; // Earth's radius in km
//     const latDiff = ((productLoc.latitude - userLoc.lat) * Math.PI) / 180;
//     const lonDiff = ((productLoc.longitude - userLoc.lon) * Math.PI) / 180;
//     const a =
//       Math.sin(latDiff / 2) ** 2 +
//       Math.cos(userLoc.lat * (Math.PI / 180)) *
//         Math.cos(productLoc.latitude * (Math.PI / 180)) *
//         Math.sin(lonDiff / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   }, []);

//   // Check network status
//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       errorToast('No internet connection. Please check your network.', {
//         duration: TOAST_DURATION,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   // Fetch product data
//   const fetchProduct = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       setError('No internet connection.');
//       return;
//     }

//     if (!productId || isNaN(parseInt(productId))) {
//       setError('Invalid product ID.');
//       setLoading(false);
//       toast.error('Invalid product ID', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: '500',
//           borderRadius: '8px',
//           padding: '12px',
//         },
//       });
//       navigate(ROUTES.CATEGORIES);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     const startTime = Date.now();

//     try {
//       const { data: productData, error: productError } = await supabase
//         .from(TABLE_NAMES.PRODUCTS)
//         .select(`
//           id,
//           title,
//           name,
//           description,
//           price,
//           display_price,
//           sale_price,
//           original_price,
//           discount_amount,
//           stock,
//           images,
//           images_json,
//           delivery_radius_km,
//           category_id,
//           seller_id,
//           seller_name,
//           latitude,
//           longitude,
//           specifications,
//           categories (id, name, is_restricted, max_delivery_radius_km),
//           product_variants(id, price, original_price, discount_amount, stock, attributes, images, status)
//         `)
//         .eq('id', productId)
//         .eq('status', STATUS_ACTIVE)
//         .eq('is_approved', true)
//         .single();

//       if (productError) throw productError;

//       if (!productData) {
//         throw new Error('Product not found.');
//       }

//       // Check delivery radius
//       let isDeliverable = true;
//       if (buyerLocation && productData.latitude && productData.longitude) {
//         const distance = calculateDistance(buyerLocation, {
//           latitude: productData.latitude,
//           longitude: productData.longitude,
//         });
//         if (distance === null) {
//           isDeliverable = false;
//           errorToast('Unable to calculate distance to product.', { duration: TOAST_DURATION });
//         } else {
//           const effectiveRadius =
//             productData.delivery_radius_km ||
//             productData.categories?.max_delivery_radius_km ||
//             DEFAULT_DELIVERY_RADIUS;
//           if (distance > effectiveRadius) {
//             isDeliverable = false;
//             errorToast(
//               `Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`,
//               { duration: TOAST_DURATION }
//             );
//           }
//         }
//       }

//       // Transform product data to match schema
//       const transformedProduct = {
//         id: productData.id,
//         name: productData.title || productData.name || 'Unnamed Product',
//         description: productData.description || '',
//         price: Number(productData.display_price || productData.sale_price || productData.price) || 0,
//         originalPrice: Number(productData.original_price) || null,
//         discountAmount: Number(productData.discount_amount) || 0,
//         stock: productData.stock || 0,
//         images: productData.images?.length > 0 ? productData.images : (productData.images_json?.images || [DEFAULT_PRODUCT_IMAGE]),
//         categoryId: productData.category_id,
//         categoryName: productData.categories?.name || '',
//         sellerId: productData.seller_id,
//         sellerName: productData.seller_name || 'Unknown Seller',
//         deliveryRadiusKm:
//           productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS,
//         specifications: productData.specifications || {},
//         variants: (productData.product_variants || [])
//           .filter((v) => v.status === STATUS_ACTIVE)
//           .map((v) => ({
//             id: v.id,
//             price: Number(v.price) || 0,
//             originalPrice: Number(v.original_price) || null,
//             discountAmount: Number(v.discount_amount) || 0,
//             stock: v.stock || 0,
//             attributes: v.attributes || {},
//             images: v.images?.length > 0 ? v.images : (productData.images?.length > 0 ? productData.images : [DEFAULT_PRODUCT_IMAGE]),
//           })),
//         isDeliverable,
//       };

//       // Ensure minimum loading duration to prevent flicker
//       const elapsed = Date.now() - startTime;
//       const remaining = MIN_LOADING_DURATION - elapsed;
//       if (remaining > 0) {
//         await new Promise((resolve) => setTimeout(resolve, remaining));
//       }

//       setProduct(transformedProduct);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching product:', err);
//       setError('Failed to load product details. Please try again.');
//       toast.error('Failed to load product details', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: '500',
//           borderRadius: '8px',
//           padding: '12px',
//         },
//       });
//       setProduct(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [productId, buyerLocation, calculateDistance, checkNetworkStatus, navigate]);

//   // Validate customer details
//   const validateCustomerDetails = useCallback(() => {
//     if (!customerDetails.name || !customerDetails.email || !customerDetails.contact) {
//       toast.error('Please fill in all customer details', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: '500',
//           borderRadius: '8px',
//           padding: '12px',
//         },
//       });
//       return false;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(customerDetails.email)) {
//       toast.error('Please enter a valid email address', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: '500',
//           borderRadius: '8px',
//           padding: '12px',
//         },
//       });
//       return false;
//     }

//     const phoneRegex = /^(\+91|0)?[789]\d{9}$/;
//     if (!phoneRegex.test(customerDetails.contact.replace(/\s/g, ''))) {
//       toast.error('Please enter a valid phone number', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: '500',
//           borderRadius: '8px',
//           padding: '12px',
//         },
//       });
//       return false;
//     }

//     return true;
//   }, [customerDetails]);

//   // Payment handlers
//   const handlePaymentSuccess = useCallback(() => {
//     successToast('Payment successful! Your order has been placed.');
//     navigate(ROUTES.ORDERS);
//   }, [navigate]);

//   const handlePaymentError = useCallback((error) => {
//     console.error('Payment failed:', error);
//     errorToast('Payment failed. Please try again or contact support.');
//   }, []);

//   const handlePaymentStart = useCallback(() => {
//     infoToast('Initiating payment...');
//   }, []);

//   const handleBuyNow = useCallback(() => {
//     if (!validateCustomerDetails()) {
//       return;
//     }
//     successToast('Proceeding to payment...');
//   }, [validateCustomerDetails]);

//   // Load product data on mount
//   useEffect(() => {
//     let isMounted = true;
//     fetchProduct().then(() => {
//       if (isMounted && location.state?.scrollPosition) {
//         window.scrollTo(0, location.state.scrollPosition);
//       }
//     });
//     return () => {
//       isMounted = false;
//     };
//   }, [fetchProduct, location.state]);

//   // Memoized product data
//   const productData = useMemo(() => product, [product]);

//   // Unified render function with transitions
//   const renderContent = () => {
//     if (loading) {
//       return (
//         <div
//           className="prod-loading-container"
//           style={{
//             maxWidth: '1200px',
//             margin: '0 auto',
//             padding: '20px',
//             opacity: loading ? 1 : 0,
//             transition: 'opacity 0.3s ease',
//             minHeight: '100vh',
//           }}
//         >
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
//             <div
//               style={{
//                 backgroundColor: '#f0f0f0',
//                 height: '400px',
//                 borderRadius: '8px',
//                 animation: 'pulse 1.5s infinite',
//               }}
//             ></div>
//             <div>
//               <div
//                 style={{
//                   backgroundColor: '#f0f0f0',
//                   height: '40px',
//                   width: '60%',
//                   borderRadius: '4px',
//                   marginBottom: '20px',
//                   animation: 'pulse 1.5s infinite',
//                 }}
//               ></div>
//               <div
//                 style={{
//                   backgroundColor: '#f0f0f0',
//                   height: '20px',
//                   width: '40%',
//                   borderRadius: '4px',
//                   marginBottom: '20px',
//                   animation: 'pulse 1.5s infinite',
//                 }}
//               ></div>
//               <div
//                 style={{
//                   backgroundColor: '#f0f0f0',
//                   height: '200px',
//                   borderRadius: '8px',
//                   marginBottom: '20px',
//                   animation: 'pulse 1.5s infinite',
//                 }}
//               ></div>
//             </div>
//           </div>
//           <style>{`
//             @keyframes pulse {
//               0% { background-color: #f0f0f0; }
//               50% { background-color: #e0e0e0; }
//               100% { background-color: #f0f0f0; }
//             }
//           `}</style>
//         </div>
//       );
//     }

//     if (error || !productData) {
//       return (
//         <div
//           className="prod-error-container"
//           style={{
//             textAlign: 'center',
//             padding: '50px',
//             backgroundColor: '#fff',
//             borderRadius: '8px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             opacity: !loading ? 1 : 0,
//             transition: 'opacity 0.3s ease',
//             minHeight: '100vh',
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'center',
//           }}
//         >
//           <h2>Product not found</h2>
//           <p>{error || 'The requested product could not be loaded.'}</p>
//           <button
//             onClick={() => navigate(ROUTES.CATEGORIES)}
//             className="prod-retry-btn"
//             aria-label="Go to categories"
//           >
//             Browse Categories
//           </button>
//         </div>
//       );
//     }

//     return (
//       <div
//         className="prod-page"
//         style={{
//           maxWidth: '1200px',
//           margin: '0 auto',
//           padding: '20px',
//           opacity: !loading ? 1 : 0,
//           transition: 'opacity 0.3s ease',
//           minHeight: '100vh',
//         }}
//       >
//         <Helmet>
//           <title>{`${productData.name} - Markeet`}</title>
//           <meta
//             name="description"
//             content={`Buy ${productData.name} on Markeet. ${productData.description || 'High-quality product with fast local delivery.'}`}
//           />
//           <meta
//             name="keywords"
//             content={`${productData.name}, ${productData.categoryName.toLowerCase()}, ecommerce, Markeet, local shopping`}
//           />
//           <meta name="robots" content="index, follow" />
//           <link rel="canonical" href={`https://www.markeet.com/product/${productData.id}`} />
//           <meta property="og:title" content={`${productData.name} - Markeet`} />
//           <meta
//             property="og:description"
//             content={`Buy ${productData.name} on Markeet. ${productData.description || 'High-quality product with fast local delivery.'}`}
//           />
//           <meta property="og:image" content={productData.images[0] || DEFAULT_PRODUCT_IMAGE} />
//           <meta property="og:url" content={`https://www.markeet.com/product/${productData.id}`} />
//           <meta name="twitter:card" content="summary_large_image" />
//           <meta name="twitter:title" content={`${productData.name} - Markeet`} />
//           <meta
//             name="twitter:description"
//             content={`Buy ${productData.name} on Markeet. ${productData.description || 'High-quality product with fast local delivery.'}`}
//           />
//           <meta name="twitter:image" content={productData.images[0] || DEFAULT_PRODUCT_IMAGE} />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'Product',
//               name: productData.name,
//               image: productData.images[0] || DEFAULT_PRODUCT_IMAGE,
//               description: productData.description || 'High-quality product available on Markeet.',
//               offers: {
//                 '@type': 'Offer',
//                 priceCurrency: CURRENCY_SYMBOL,
//                 price: (productData.price / 100).toFixed(2),
//                 availability: productData.stock > 0 ? 'InStock' : 'OutOfStock',
//               },
//             })}
//           </script>
//         </Helmet>

//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
//           {/* Product Images */}
//           <div
//             className="prod-images"
//             style={{
//               backgroundColor: '#f8f9fa',
//               height: '400px',
//               borderRadius: '8px',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               border: '1px solid #e9ecef',
//             }}
//           >
//             <img
//               src={productData.images[0] || DEFAULT_PRODUCT_IMAGE}
//               alt={productData.name}
//               style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
//               onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
//               loading="lazy"
//             />
//           </div>

//           {/* Product Details */}
//           <div className="prod-details">
//             <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>{productData.name}</h1>
//             <p style={{ color: '#666', marginBottom: '10px' }}>Category: {productData.categoryName}</p>
//             <p style={{ color: '#666', marginBottom: '10px' }}>Sold by: {productData.sellerName}</p>
//             <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '20px' }}>
//               {CURRENCY_SYMBOL}{(productData.price / 100).toFixed(2)}
//               {productData.originalPrice && productData.originalPrice > productData.price && (
//                 <span style={{ fontSize: '18px', color: '#666', textDecoration: 'line-through', marginLeft: '10px' }}>
//                   {CURRENCY_SYMBOL}{(productData.originalPrice / 100).toFixed(2)}
//                 </span>
//               )}
//             </div>
//             <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>{productData.description}</p>
//             <p style={{ color: productData.isDeliverable ? '#27ae60' : '#e74c3c', marginBottom: '20px' }}>
//               {productData.isDeliverable
//                 ? `Available for delivery within ${productData.deliveryRadiusKm} km`
//                 : 'Not available in your area'}
//             </p>

//             {/* Specifications (if available) */}
//             {Object.keys(productData.specifications).length > 0 && (
//               <div style={{ marginBottom: '30px' }}>
//                 <h3 style={{ marginBottom: '15px', color: '#333' }}>Specifications</h3>
//                 <ul style={{ listStyle: 'none', padding: 0 }}>
//                   {Object.entries(productData.specifications).map(([key, value], index) => (
//                     <li
//                       key={index}
//                       style={{
//                         padding: '8px 0',
//                         borderBottom: '1px solid #f0f0f0',
//                         display: 'flex',
//                         alignItems: 'center',
//                       }}
//                     >
//                       <span style={{ color: '#27ae60', marginRight: '10px', fontSize: '18px' }}>✓</span>
//                       <strong>{key}:</strong> {value}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Customer Details Form */}
//             <div
//               style={{
//                 backgroundColor: '#f8f9fa',
//                 padding: '20px',
//                 borderRadius: '8px',
//                 marginBottom: '30px',
//                 border: '1px solid #e9ecef',
//               }}
//             >
//               <h3 style={{ marginBottom: '15px', color: '#333' }}>Customer Details</h3>
//               <div style={{ display: 'grid', gap: '15px' }}>
//                 <input
//                   type="text"
//                   placeholder="Full Name"
//                   value={customerDetails.name}
//                   onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
//                   style={{
//                     padding: '10px',
//                     border: '1px solid #ddd',
//                     borderRadius: '4px',
//                     fontSize: '14px',
//                   }}
//                   aria-label="Full Name"
//                 />
//                 <input
//                   type="email"
//                   placeholder="Email Address"
//                   value={customerDetails.email}
//                   onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
//                   style={{
//                     padding: '10px',
//                     border: '1px solid #ddd',
//                     borderRadius: '4px',
//                     fontSize: '14px',
//                   }}
//                   aria-label="Email Address"
//                 />
//                 <input
//                   type="tel"
//                   placeholder="Phone Number"
//                   value={customerDetails.contact}
//                   onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contact: e.target.value }))}
//                   style={{
//                     padding: '10px',
//                     border: '1px solid #ddd',
//                     borderRadius: '4px',
//                     fontSize: '14px',
//                   }}
//                   aria-label="Phone Number"
//                 />
//               </div>
//             </div>

//             {/* Checkout Button */}
//             <div className="prod-checkout-section">
//               <CheckoutButton
//                 amount={productData.price}
//                 currency={CURRENCY_SYMBOL}
//                 productName={productData.name}
//                 productId={productData.id}
//                 customerDetails={customerDetails}
//                 buttonText="Buy Now"
//                 buttonClassName="large primary"
//                 onPaymentStart={handlePaymentStart}
//                 onPaymentSuccess={handlePaymentSuccess}
//                 onPaymentError={handlePaymentError}
//                 onClick={handleBuyNow}
//                 disabled={!productData.isDeliverable || productData.stock <= 0}
//               />
//             </div>

//             {/* Additional Information */}
//             <div
//               style={{
//                 marginTop: '30px',
//                 padding: '20px',
//                 backgroundColor: '#e8f5e8',
//                 borderRadius: '8px',
//                 border: '1px solid #c3e6c3',
//               }}
//             >
//               <h4 style={{ marginBottom: '10px', color: '#2d5a2d' }}>Why Choose Us?</h4>
//               <ul style={{ margin: 0, paddingLeft: '20px', color: '#2d5a2d' }}>
//                 <li>Free shipping on orders above ₹999</li>
//                 <li>30-day money-back guarantee</li>
//                 <li>24/7 customer support</li>
//                 <li>Secure payment processing</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//         <Footer />
//       </div>
//     );
//   };

//   return (
//     <ErrorBoundary>
//       <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION, ariaProps: { role: 'alert', 'aria-live': 'assertive' } }} />
//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//         .prod-loading-container, .prod-error-container, .prod-page {
//           min-height: 100vh;
//           display: flex;
//           flex-direction: column;
//           justify-content: center;
//         }
//         .prod-retry-btn {
//           padding: 10px 20px;
//           background-color: #3498db;
//           color: #fff;
//           border: none;
//           border-radius: 4px;
//           cursor: pointer;
//           font-size: 16px;
//         }
//         .prod-retry-btn:hover {
//           background-color: #2980b9;
//         }
//       `}</style>
//       {renderContent()}
//     </ErrorBoundary>
//   );
// };

// export default React.memo(ProductPage);


// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/scrollManager';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };

// // Utility to format currency using shared price utilities
// const formatCurrency = (value) => formatPrice(value);

// // Utility to calculate distance
// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// // Fisher-Yates shuffle
// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// // StarRatingDisplay component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

//   // Enhanced navigation with scroll memory
//   const { navigate, goBack: navigateBack, navigateToCategory } = useEnhancedNavigation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);
//   const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
//   const maxLocationRetries = 3;

//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= maxLocationRetries) {
//       if (locationRetries >= maxLocationRetries) {
//         toast.error('Maximum location detection attempts reached. Using default location (Bengaluru).', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
//         setLocationLoading(false);
//         setLocationRetries(0);
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);
//     console.log('Retrying location detection...', { attempt: locationRetries + 1 });

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const detectedLocation = { lat: latitude, lon: longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           console.log('Location detected on retry:', detectedLocation);
//         },
//         (error) => {
//           console.warn('Location detection failed on retry:', error);
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           console.log('Using default location on retry (Bengaluru):', defaultLocation);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: 6000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: 6000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [setBuyerLocation, locationLoading, locationRetries]);

//   const getActiveVariant = useMemo(
//     () => () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex],
//   );

//   const getDisplayedImages = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const productImages = product?.images || [];
//       const variantImages = activeVariant?.images || [];
//       const mergedImages = [...new Set([...productImages, ...variantImages])];
//       return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//     },
//     [product, getActiveVariant],
//   );

//   const isOutOfStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock <= 0;
//     },
//     [product, getActiveVariant],
//   );

//   const isLowStock = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const stock = activeVariant?.stock ?? product?.stock ?? 0;
//       return stock > 0 && stock < 5;
//     },
//     [product, getActiveVariant],
//   );

//   // Get price display information using shared utilities
//   const getPriceInfo = useMemo(
//     () => () => {
//       const activeVariant = getActiveVariant();
//       const item = activeVariant || product;
//       if (!item) return null;
      
//       return getPriceDisplayInfo(item);
//     },
//     [product, getActiveVariant],
//   );

//   const averageRating = useMemo(
//     () =>
//       reviews.length > 0
//         ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//         : 0,
//     [reviews],
//   );

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) {
//         console.error('Reviews fetch error:', reviewsError);
//         throw new Error('Failed to load reviews');
//       }

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       console.warn('No buyer location available, attempting to detect');
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         setError('Product not found.');
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude,
//         longitude: productData.sellers?.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(
//           `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
//           {
//             duration: 4000,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           },
//         );
//         setError('Product is not available in your area.');
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: variant.images && variant.images.length ? variant.images : productData.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(`Failed to load product: ${err.message}`);
//       toast.error(`Failed to load product. Please try again.`, {
//         duration: 4000,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, location.state, navigate, navigateToCategory, checkNetworkStatus, buyerLocation, retryLocationDetection, fetchProductReviews]);

//   const fetchRelatedProducts = useCallback(
//     async (product, retryCount = 0) => {
//       if (!product || !product.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: 6000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${product.id}-${product.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       if (relatedCache.current[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         // Fetch non-restricted category IDs
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(product.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Using direct query (RPC function disabled)
//         let relatedData;
        
//         // Direct query for related products
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//             .select(`
//               id, title, price, original_price, discount_amount, images, seller_id, category_id,
//               delivery_radius_km, categories(name, max_delivery_radius_km),
//               sellers(latitude, longitude)
//             `)
//             .eq('category_id', product.category_id)
//             .neq('id', product.id)
//             .eq('is_approved', true)
//             .eq('status', 'active')
//             .limit(10);
        
//         if (fallbackError) {
//           console.error('Related products query error:', fallbackError);
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }
        
//         relatedData = fallbackData;

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         // Filter out items with undefined category_id to prevent query errors
//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
        
//         // Fetch category details only if we have valid category IDs and the RPC didn't provide max_delivery_radius_km
//         let categoryData = [];
//         if (validRelatedData.length > 0 && validRelatedData.some(item => item.max_delivery_radius_km == null)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await supabase
//             .from('categories')
//             .select('id, max_delivery_radius_km')
//             .in('id', categoryIds);
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         // Normalize and filter related products
//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || validRelatedData.find((d) => d.seller_id === item.seller_id);
//             // Use max_delivery_radius_km from RPC result if available, otherwise fetch from categoryData
//             const maxDeliveryRadius = item.max_delivery_radius_km || 
//               (categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km);
//             // Prefer server-calculated distance_km; fallback to client calculation
//             let distance = (typeof item.distance_km === 'number') ? item.distance_km : (
//               seller ? calculateDistance(buyerLocation, {
//                 latitude: seller.latitude,
//                 longitude: seller.longitude,
//               }) : null
//             );
//             if (distance !== null && distance !== undefined) {
//               distance = parseFloat(Number(distance).toFixed(2));
//             }
//             const effectiveRadius = item.delivery_radius_km || maxDeliveryRadius || 40;

//             return {
//               ...item,
//               price: parseFloat(item.price) || 0,
//               originalPrice: item.original_price ? parseFloat(item.original_price) : null,
//               discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
//               category_name: item.categories?.name || item.category_name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
//               deliveryRadius: effectiveRadius,
//               distance: (distance !== null && distance !== undefined) ? distance : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === product.id) return false;
//             // Use current product's delivery radius instead of related product's radius
//             const currentProductRadius = product.delivery_radius_km || 
//               (product.categories?.max_delivery_radius_km) || 40;
//             if (item.distance === null || item.distance > currentProductRadius) return false;
//             if (isCategoryRestricted && !location.state?.fromCategories) return false;
//             return true;
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache.current[cacheKey] = shuffled;
//         localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
//           return;
//         }
//         setRelatedProducts([]);
//         toast.error('Unable to load related products. Please try again later.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection],
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages();
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages],
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') {
//         handleCloseFullScreen();
//       } else if (e.key === 'ArrowLeft') {
//         fullScreenSliderRef.current?.slickPrev();
//       } else if (e.key === 'ArrowRight') {
//         fullScreenSliderRef.current?.slickNext();
//       }
//     },
//     [isFullScreenOpen, handleCloseFullScreen],
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock()) {
//         toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories');
//         return;
//       }

//       const activeVariant = getActiveVariant();
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId !== null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId !== null) {
//             query = query.eq('variant_id', variantId);
//           } else {
//             query = query.is('variant_id', null);
//           }

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) {
//               console.error('Cart update error:', upsertError);
//               throw new Error('Failed to update cart');
//             }
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) {
//               console.error('Cart insert error:', insertError);
//               throw new Error('Failed to add to cart');
//             }
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey,
//         );
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item,
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: 4000,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock],
//   );

//   useEffect(() => {
//     if (buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchProductAndVariants();
//     } else if (!locationLoading) {
//       retryLocationDetection();
//     }
//   }, [buyerLocation, locationLoading, retryLocationDetection, fetchProductAndVariants]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   if (loading || locationLoading) {
//     return (
//       <div className="loading" role="status" aria-live="polite">
//         <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         <span>{locationLoading ? 'Detecting location...' : 'Loading...'}</span>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="error" role="alert" aria-live="assertive">
//         {error || 'Product not found.'}
//         <div className="error-actions">
//           <button
//             onClick={retryLocationDetection}
//             className="retry-btn"
//             aria-label="Retry loading product"
//             disabled={locationLoading}
//           >
//             Retry Location
//           </button>
//           <button
//             onClick={() => navigate('/products')}
//             className="back-btn"
//             aria-label="Back to products"
//           >
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const displayedImages = getDisplayedImages();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const variantAttributes = variants
//     .map((v, index) => ({
//       id: v.id,
//       index,
//       attributes: Object.entries(v.attributes || {})
//         .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//         .map(([key, val]) => `${key}: ${val}`)
//         .join(', '),
//     }))
//     .filter((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{`${productName} - Markeet`}</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={displayedImages[0]} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             category: product.category_name,
//             offers: {
//               '@type': 'Offer',
//               price: getActiveVariant()?.price || product.price,
//               priceCurrency: 'INR',
//               availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0
//               ? {
//                   '@type': 'AggregateRating',
//                   ratingValue: averageRating.toFixed(1),
//                   reviewCount: reviews.length,
//                 }
//               : null,
//             review: reviews.map((r) => ({
//               '@type': 'Review',
//               author: { '@type': 'Person', name: r.reviewer_name },
//               reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//               reviewBody: r.review_text,
//               datePublished: r.created_at,
//             })),
//           })}
//         </script>
//       </Helmet>
//       <Toaster />

//       <button
//         onClick={() => {
//           // Enhanced back navigation with scroll restoration
//           const state = location.state;
          
//           // If we came from a category page, go back to that category
//           if (state?.fromCategory && state?.categoryId) {
//             navigateToCategory(`/products?category=${state.categoryId}`, true);
//           } else {
//             // Use enhanced back navigation with fallback
//             navigateBack();
//           }
//         }}
//         className="enhanced-back-btn"
//         aria-label="Back to previous page"
//       >
//         ← Back
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider
//                 dots
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows
//                 autoplay={false}
//                 className="image-slider"
//               >
//                 {displayedImages.map((img, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={img}
//                       alt={`${productName} - ${i + 1}`}
//                       onClick={() => handleImageClick(i)}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} - ${i + 1} in full screen`}
//                       onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onClick={() => handleImageClick(0)}
//                   onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} in full screen`}
//                   onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           <div
//             className={`price-section ${
//               getPriceInfo()?.hasDiscount ? 'offer-highlight' : ''
//             }`}
//           >
//             <span className="current-price">{getPriceInfo()?.formattedFinal}</span>
//             {getPriceInfo()?.hasDiscount && (
//               <span className="original-price">
//                 {getPriceInfo()?.formattedOriginal}
//               </span>
//             )}
//             {getPriceInfo()?.savings > 0 && (
//               <span className="discount">
//                 Save {getPriceInfo()?.formattedSavings}
//               </span>
//             )}
//           </div>
//           {isLowStock() && (
//             <p className="low-stock-warning" aria-live="polite">
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(Boolean).map((point, i) => (
//               <li key={i}>{point.trim()}</li>
//             )) || <li>No description available.</li>}
//           </ul>
//           {variantAttributes.length > 0 && (
//             <div className="variant-section">
//               <h4 id="variant-section-label">Select Variant</h4>
//               <div
//                 role="radiogroup"
//                 aria-labelledby="variant-section-label"
//                 className="variant-options"
//               >
//                 {variantAttributes.map((v) => (
//                   <button
//                     key={v.id}
//                     className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                     onClick={() => setSelectedVariantIndex(v.index)}
//                     aria-label={`Select variant: ${v.attributes}`}
//                     role="radio"
//                     aria-checked={v.index === selectedVariantIndex}
//                   >
//                     {v.attributes}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               onClick={() => addToCart(true)}
//               className="buy-now-button"
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link
//               to={`/seller/${product.seller_id}`}
//               className="seller-link"
//               aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//             >
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider
//               ref={fullScreenSliderRef}
//               dots={false}
//               infinite
//               speed={500}
//               slidesToShow={1}
//               slidesToScroll={1}
//               arrows={false}
//               initialSlide={fullScreenImageIndex}
//               afterChange={setFullScreenImageIndex}
//             >
//               {displayedImages.map((img, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={img}
//                             alt={`${productName} - ${i + 1}`}
//                             onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                             onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                             +
//                           </button>
//                           <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                             -
//                           </button>
//                           <button
//                             className="zoom-btn"
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                           >
//                             ↺
//                           </button>
//                         </div>
//                       </>
//                     )}
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   className="full-screen-nav-btn prev"
//                   onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                   aria-label="Previous image"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={() => fullScreenSliderRef.current?.slickNext()}
//                   aria-label="Next image"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <button
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
//                       aria-label={`Go to image ${i + 1}`}
//                       aria-current={i === fullScreenImageIndex}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen viewer"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, i) => (
//             <div key={review.id} className="review-item">
//               <div className="review-header">
//                 <span className="review-author">{review.reviewer_name}</span>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <p className="review-reply">Seller Reply: {review.reply_text}</p>
//               )}
//               <time className="review-date" dateTime={review.created_at}>
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </time>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], i) => (
//               <div key={i} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>

//       <div className="related-products-section">
//         <h3>Related Products</h3>
//         {isRelatedLoading ? (
//           <div className="related-products-loading">
//             <p>Fetching related products...</p>
//             <div className="related-products-grid">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="related-product-skeleton">
//                   <div className="skeleton-image" />
//                   <div className="skeleton-text" />
//                   <div className="skeleton-text short" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         ) : relatedProducts.length > 0 ? (
//           <div className="related-products-grid">
//             {relatedProducts.map((item, i) => (
//               <div
//                 key={item.id}
//                 className="related-product-card"
//                 onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                 aria-label={`View ${item.title} in ${item.category_name}`}
//                 style={{ animationDelay: `${i * 0.1}s` }}
//               >
//                 <div className="related-product-image-wrapper">
//                   {item.discountAmount > 0 && (
//                     <span className="related-offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{item.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={item.images?.[0] || DEFAULT_IMAGE}
//                     alt={item.title}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="related-product-image"
//                     loading="lazy"
//                   />
//                 </div>
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{item.title}</h4>
//                   <div className="related-product-price-section">
//                     <p className="related-product-price">{formatCurrency(item.price)}</p>
//                     {item.originalPrice && item.originalPrice > item.price && (
//                       <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
//                     )}
//                   </div>
//                   <p className="related-product-category">{item.category_name}</p>
//                   {item.distance && (
//                     <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="related-products-empty">
//             <p className="no-specs">No related products available in your area.</p>
//             <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//           </div>
//         )}
//       </div>

//       <img
//         src={icon}
//         alt="Markeet Logo"
//         className="product-icon"
//       />
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/scrollManager';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import icon from '../assets/icon.png';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };
// const TOAST_DURATION = 4000;
// const MAX_LOCATION_RETRIES = 3;
// const MIN_LOADING_DURATION = 500;
// const DEFAULT_DELIVERY_RADIUS = 40;

// // Utility Functions
// const formatCurrency = (value) => formatPrice(value);

// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return parseFloat((R * c).toFixed(2));
// };

// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// const safeParseJSON = (key, defaultValue) => {
//   const item = localStorage.getItem(key);
//   if (item === null || item === 'undefined') {
//     console.warn(`No valid data found in localStorage for key: ${key}`);
//     return defaultValue;
//   }
//   try {
//     return JSON.parse(item) || defaultValue;
//   } catch (err) {
//     console.error(`Failed to parse ${key} from localStorage:`, err);
//     return defaultValue;
//   }
// };

// const formatSpecValue = (value) => {
//   if (value === null || value === undefined) return 'N/A';
//   if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
//     return String(value);
//   }
//   if (typeof value === 'object') {
//     return JSON.stringify(value, null, 2).replace(/[{}[\]]/g, '').trim();
//   }
//   return 'N/A';
// };

// // Error Boundary Component
// class ErrorBoundary extends React.Component {
//   state = { hasError: false, error: null };

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="error" role="alert" aria-live="assertive">
//           <h2>Something went wrong</h2>
//           <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
//           <div className="error-actions">
//             <button
//               onClick={() => window.location.reload()}
//               className="retry-btn"
//               aria-label="Retry loading page"
//             >
//               Retry
//             </button>
//             <button
//               onClick={() => window.location.href = '/products'}
//               className="back-btn"
//               aria-label="Go to products"
//             >
//               Browse Products
//             </button>
//           </div>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// // StarRatingDisplay Component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate(); // Fallback navigation
//   const { navigate: enhancedNavigate, goBack: navigateBack, navigateToCategory = navigate } = useEnhancedNavigation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

//   // State
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => safeParseJSON('cart', []));
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);

//   // Memoized Values
//   const getActiveVariant = useMemo(
//     () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex]
//   );

//   const getDisplayedImages = useMemo(() => {
//     const productImages = product?.images || [];
//     const variantImages = getActiveVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//   }, [product?.images, getActiveVariant]);

//   const isOutOfStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock <= 0;
//   }, [product?.stock, getActiveVariant]);

//   const isLowStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock > 0 && stock < 5;
//   }, [product?.stock, getActiveVariant]);

//   const getPriceInfo = useMemo(() => {
//     const item = getActiveVariant || product;
//     if (!item) return null;
//     return getPriceDisplayInfo(item);
//   }, [product, getActiveVariant]);

//   const averageRating = useMemo(() => {
//     return reviews.length > 0
//       ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//       : 0;
//   }, [reviews]);

//   const variantAttributes = useMemo(() =>
//     variants
//       .map((v, index) => ({
//         id: v.id,
//         index,
//         attributes: Object.entries(v.attributes || {})
//           .filter(([key, val]) => val && val.toString().trim() && key !== 'attribute1')
//           .map(([key, val]) => `${key}: ${val}`)
//           .join(', '),
//       }))
//       .filter((v) => v.attributes),
//     [variants]
//   );

//   // Callbacks
//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= MAX_LOCATION_RETRIES) {
//       if (locationRetries >= MAX_LOCATION_RETRIES) {
//         const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//         setBuyerLocation(defaultLocation);
//         setLocationLoading(false);
//         setLocationRetries(0);
//         try {
//           localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//         } catch (err) {
//           console.error('Failed to save buyerLocation to localStorage:', err);
//         }
//         toast.error('Maximum location attempts reached. Using default location (Bengaluru).', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);
//     console.log('Retrying location detection...', { attempt: locationRetries + 1 });

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const detectedLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(detectedLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//           console.log('Location detected on retry:', detectedLocation);
//         },
//         (error) => {
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//           } catch (err) {
//             console.error('Failed to save buyerLocation to localStorage:', err);
//           }
//           console.warn('Location detection failed on retry:', error);
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       try {
//         localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//       } catch (err) {
//         console.error('Failed to save buyerLocation to localStorage:', err);
//       }
//       console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [locationRetries, setBuyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       console.error('Reviews fetch error:', err);
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!id || isNaN(parseInt(id, 10))) {
//       setError('Invalid product ID.');
//       setLoading(false);
//       toast.error('Invalid product ID.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       navigate('/products');
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       console.warn('No buyer location available, attempting to detect');
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     const startTime = Date.now();

//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           id, title, description, price, original_price, discount_amount, images, stock, status,
//           delivery_radius_km, latitude, longitude, specifications, seller_id,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .is('deleted_at', null) // Filter out soft-deleted products
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         throw new Error('Product not found.');
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude || productData.latitude,
//         longitude: productData.sellers?.longitude || productData.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//       if (distance === null || distance > effectiveRadius) {
//         setError(`Product not available in your area (${distance?.toFixed(2) || 'unknown'} km > ${effectiveRadius} km).`);
//         toast.error(`Product not available in your area.`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/products');
//         return;
//       }

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         setError('Please access this restricted category via the Categories page.');
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories', { state: { fromCategories: true } });
//         return;
//       }

//       const normalizedSpecifications = {};
//       if (productData.specifications && typeof productData.specifications === 'object') {
//         Object.entries(productData.specifications).forEach(([key, value]) => {
//           normalizedSpecifications[key] = formatSpecValue(value);
//         });
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || parseFloat(productData.original_price - (productData.discount_amount || 0)) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//         images: Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean) || [DEFAULT_IMAGE],
//         specifications: normalizedSpecifications,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images, status')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active')
//         .is('deleted_at', null); // Filter out soft-deleted variants
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: Array.isArray(variant.images) ? variant.images : [variant.images].filter(Boolean) || normalizedProduct.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.toString().trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);

//       const elapsed = Date.now() - startTime;
//       const remaining = MIN_LOADING_DURATION - elapsed;
//       if (remaining > 0) {
//         await new Promise((resolve) => setTimeout(resolve, remaining));
//       }
//     } catch (err) {
//       console.error('Product fetch error:', err);
//       setError(err.message || 'Failed to load product.');
//       toast.error(err.message || 'Failed to load product.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, buyerLocation, fetchProductReviews, navigate, navigateToCategory, location.state, checkNetworkStatus, retryLocationDetection]);

//   const fetchRelatedProducts = useCallback(
//     async (currentProduct, retryCount = 0) => {
//       if (!currentProduct?.id || !currentProduct.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         console.warn('No buyer location available for related products');
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${currentProduct.id}-${currentProduct.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       const relatedCache = safeParseJSON(CACHE_KEY, {});

//       if (relatedCache[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(currentProduct.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const { data: relatedData, error: relatedError } = await supabase
//           .from('products')
//           .select(`
//             id, title, price, original_price, discount_amount, images, seller_id, category_id,
//             delivery_radius_km, categories(name, max_delivery_radius_km),
//             sellers(latitude, longitude)
//           `)
//           .eq('category_id', currentProduct.category_id)
//           .neq('id', currentProduct.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .is('deleted_at', null) // Filter out soft-deleted products
//           .limit(10);
//         if (relatedError) throw new Error(`Related products fetch error: ${relatedError.message}`);

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
//         let categoryData = [];
//         if (validRelatedData.some((item) => !item.categories?.max_delivery_radius_km)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await supabase
//             .from('categories')
//             .select('id, max_delivery_radius_km')
//             .in('id', categoryIds);
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || {};
//             const maxDeliveryRadius =
//               item.categories?.max_delivery_radius_km ||
//               categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km ||
//               DEFAULT_DELIVERY_RADIUS;
//             const distance = calculateDistance(buyerLocation, {
//               latitude: seller.latitude || item.latitude,
//               longitude: seller.longitude || item.longitude,
//             });
//             return {
//               ...item,
//               price: parseFloat(item.price) || parseFloat(item.original_price - (item.discount_amount || 0)) || 0,
//               original_price: parseFloat(item.original_price) || null,
//               discount_amount: parseFloat(item.discount_amount) || 0,
//               category_name: item.categories?.name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean) || [DEFAULT_IMAGE],
//               deliveryRadius: maxDeliveryRadius,
//               distance: distance != null ? parseFloat(distance.toFixed(2)) : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === currentProduct.id) return false;
//             const effectiveRadius = currentProduct.delivery_radius_km || currentProduct.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//             return item.distance != null && item.distance <= effectiveRadius && !(isCategoryRestricted && !location.state?.fromCategories);
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache[cacheKey] = shuffled;
//         try {
//           localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache));
//         } catch (err) {
//           console.error('Failed to save relatedCache to localStorage:', err);
//         }
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         console.error('Related products fetch error:', err);
//         if (retryCount < 2) {
//           console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
//           setTimeout(() => fetchRelatedProducts(currentProduct, retryCount + 1), 1000);
//           return;
//         }
//         toast.error('Unable to load related products.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setRelatedProducts([]);
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection]
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages;
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages]
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') handleCloseFullScreen();
//       else if (e.key === 'ArrowLeft') fullScreenSliderRef.current?.slickPrev();
//       else if (e.key === 'ArrowRight') fullScreenSliderRef.current?.slickNext();
//     },
//     [isFullScreenOpen, handleCloseFullScreen]
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock) {
//         toast.error(isOutOfStock ? 'This item is out of stock.' : 'Product not available.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       if (isRestricted && !location.state?.fromCategories) {
//         toast.error('Please access this restricted category via the Categories page.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigateToCategory('/categories', { state: { fromCategories: true } });
//         return;
//       }

//       const activeVariant = getActiveVariant;
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId != null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages,
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId != null) query = query.eq('variant_id', variantId);
//           else query = query.is('variant_id', null);

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             console.error('Cart fetch error:', fetchError);
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: TOAST_DURATION,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) throw new Error('Failed to update cart');
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) throw new Error('Failed to add to cart');
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex((item) => item.uniqueKey === cartItem.uniqueKey);
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }

//         setCart(updatedCart);
//         try {
//           localStorage.setItem('cart', JSON.stringify(updatedCart));
//         } catch (err) {
//           console.error('Failed to save cart to localStorage:', err);
//         }
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         console.error('Add to cart error:', err);
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock]
//   );

//   // Effects
//   useEffect(() => {
//     const storedLocation = safeParseJSON('buyerLocation', null);
//     if (storedLocation?.lat && storedLocation?.lon) {
//       setBuyerLocation(storedLocation);
//     } else {
//       retryLocationDetection();
//     }
//   }, [setBuyerLocation, retryLocationDetection]);

//   useEffect(() => {
//     if (!id || !buyerLocation?.lat || !buyerLocation?.lon || locationLoading) {
//       return;
//     }
//     let isMounted = true;
//     fetchProductAndVariants();
//     return () => {
//       isMounted = false;
//     };
//   }, [id, buyerLocation, locationLoading, fetchProductAndVariants]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   useEffect(() => {
//     if (product?.specifications) {
//       console.log('Product specifications:', product.specifications);
//     }
//   }, [product]);

//   // Render
//   const renderContent = () => {
//     if (loading || locationLoading) {
//       return (
//         <div className="loading" role="status" aria-live="polite">
//           <div className="product-page-container">
//             <div className="main-content">
//               <div className="product-image-section">
//                 <div className="single-image-wrapper skeleton-image"></div>
//               </div>
//               <div className="product-details-section">
//                 <div className="skeleton-text" style={{ height: '28px', marginBottom: '16px' }}></div>
//                 <div className="skeleton-text short" style={{ height: '20px', marginBottom: '16px' }}></div>
//                 <div className="skeleton-text" style={{ height: '24px', marginBottom: '16px' }}></div>
//                 <div className="skeleton-text" style={{ height: '80px', marginBottom: '16px' }}></div>
//                 <div className="skeleton-text" style={{ height: '120px', marginBottom: '16px' }}></div>
//                 <div className="skeleton-text" style={{ height: '48px' }}></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (error || !product) {
//       return (
//         <div className="error" role="alert" aria-live="assertive">
//           <h2>Product not found</h2>
//           <p>{error || 'The requested product could not be loaded.'}</p>
//           <div className="error-actions">
//             <button
//               onClick={retryLocationDetection}
//               className="retry-btn"
//               aria-label="Retry location detection"
//               disabled={locationLoading}
//             >
//               Retry Location
//             </button>
//             <button
//               onClick={() => navigate('/products')}
//               className="back-btn"
//               aria-label="Back to products"
//             >
//               Browse Products
//             </button>
//           </div>
//         </div>
//       );
//     }

//     const displayedImages = getDisplayedImages;
//     const productName = product.title || product.name || 'Product';
//     const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//     const productUrl = `https://www.markeet.com/product/${id}`;
//     const availability = isOutOfStock ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';

//     return (
//       <div className="product-page-container loaded">
//         <Helmet>
//           <title>{`${productName} - Markeet`}</title>
//           <meta name="description" content={productDescription} />
//           <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//           <link rel="canonical" href={productUrl} />
//           <meta property="og:title" content={`${productName} - Markeet`} />
//           <meta property="og:description" content={productDescription} />
//           <meta property="og:image" content={displayedImages[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={productUrl} />
//           <meta property="og:type" content="product" />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'Product',
//               name: productName,
//               description: productDescription,
//               image: displayedImages,
//               category: product.category_name,
//               offers: {
//                 '@type': 'Offer',
//                 price: (getActiveVariant?.price || product.price) / 100,
//                 priceCurrency: 'INR',
//                 availability,
//                 seller: {
//                   '@type': 'Organization',
//                   name: product.sellers?.store_name || 'Markeet Seller',
//                 },
//               },
//               aggregateRating: reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: reviews.length,
//                   }
//                 : null,
//               review: reviews.map((r) => ({
//                 '@type': 'Review',
//                 author: { '@type': 'Person', name: r.reviewer_name },
//                 reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//                 reviewBody: r.review_text,
//                 datePublished: r.created_at,
//               })),
//             })}
//           </script>
//         </Helmet>

//         <button
//           onClick={() => {
//             const state = location.state || {};
//             if (state.fromCategory && state.categoryId) {
//               navigateToCategory(`/products?category=${state.categoryId}`, { state: { ...state, fromCategories: true } });
//             } else {
//               navigateBack();
//             }
//           }}
//           className="enhanced-back-btn"
//           aria-label="Back to previous page"
//         >
//           ← Back
//         </button>

//         <div className="main-content">
//           <div className="product-image-section">
//             <div className="image-slider-container">
//               {displayedImages.length > 1 ? (
//                 <Slider
//                   dots
//                   infinite
//                   speed={500}
//                   slidesToShow={1}
//                   slidesToScroll={1}
//                   arrows
//                   autoplay={false}
//                   className="image-slider"
//                 >
//                   {displayedImages.map((img, index) => (
//                     <div key={index} className="slider-image-wrapper">
//                       <img
//                         src={img}
//                         alt={`${productName} ${index + 1}`}
//                         onClick={() => handleImageClick(index)}
//                         onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                         className="clickable-image"
//                         role="button"
//                         tabIndex={0}
//                         aria-label={`View ${productName} ${index + 1} in full screen`}
//                         onKeyDown={(e) => e.key === 'Enter' && handleImageClick(index)}
//                         loading="lazy"
//                       />
//                     </div>
//                   ))}
//                 </Slider>
//               ) : (
//                 <div className="single-image-wrapper">
//                   <img
//                     src={displayedImages[0]}
//                     alt={productName}
//                     onClick={() => handleImageClick(0)}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="clickable-image"
//                     role="button"
//                     tabIndex={0}
//                     aria-label={`View ${productName} in full screen`}
//                     onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                     loading="lazy"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="product-details-section">
//             <h1 className="product-title">{productName}</h1>
//             <div className={`price-section ${getPriceInfo?.hasDiscount ? 'offer-highlight' : ''}`}>
//               {getPriceInfo?.hasDiscount && <span className="deal-label">Special Offer</span>}
//               <div className="price-details">
//                 <span className="current-price">{getPriceInfo?.formattedFinal}</span>
//                 {getPriceInfo?.hasDiscount && (
//                   <>
//                     <span className="original-price">{getPriceInfo?.formattedOriginal}</span>
//                     <span className="discount">Save {getPriceInfo?.formattedSavings}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//             {isLowStock && (
//               <p className="low-stock-warning" aria-live="polite">
//                 Hurry! Only {getActiveVariant?.stock || product.stock} left in stock.
//               </p>
//             )}
//             {isOutOfStock && (
//               <p className="low-stock-warning" aria-live="polite">
//                 Out of stock
//               </p>
//             )}
//             <ul className="product-highlights">
//               {product.description?.split(';').filter(Boolean).map((point, index) => (
//                 <li key={index}>{point.trim()}</li>
//               )) || <li>No description available.</li>}
//             </ul>
//             {variantAttributes.length > 0 && (
//               <div className="variant-section">
//                 <h4 id="variant-section-label">Select Variant</h4>
//                 <div role="radiogroup" aria-labelledby="variant-section-label" className="variant-options">
//                   {variantAttributes.map((v) => (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => setSelectedVariantIndex(v.index)}
//                       aria-label={`Select variant: ${v.attributes || 'Default'}`}
//                       role="radio"
//                       aria-checked={v.index === selectedVariantIndex}
//                       disabled={variants[v.index].stock <= 0}
//                     >
//                       {v.attributes || 'Default'}
//                       {variants[v.index].stock <= 5 && variants[v.index].stock > 0 && (
//                         <span> (Low stock: {variants[v.index].stock})</span>
//                       )}
//                       {variants[v.index].stock === 0 && <span> (Out of stock)</span>}
//                     </button>
//                   ))}
//                 </div>
//                 {getActiveVariant && (
//                   <p className="variant-price-info">
//                     Selected variant price: {formatCurrency(getActiveVariant.price)}
//                   </p>
//                 )}
//               </div>
//             )}
//             <div className="action-buttons">
//               <button
//                 onClick={() => addToCart(false)}
//                 className="add-to-cart-button"
//                 disabled={isOutOfStock}
//                 aria-label={`Add ${productName} to cart`}
//               >
//                 {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
//               </button>
//               <button
//                 onClick={() => addToCart(true)}
//                 className="buy-now-button"
//                 disabled={isOutOfStock}
//                 aria-label={`Buy ${productName} now`}
//               >
//                 Buy Now
//               </button>
//             </div>
//             <div className="seller-info">
//               <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//               <Link
//                 to={`/seller/${product.seller_id}`}
//                 className="seller-link"
//                 aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//               >
//                 View Seller Profile
//               </Link>
//             </div>
//           </div>
//         </div>

//         {isFullScreenOpen && (
//           <div
//             className="full-screen-image"
//             role="dialog"
//             aria-label="Full screen viewer"
//             onClick={handleCloseFullScreen}
//           >
//             <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//               <Slider
//                 ref={fullScreenSliderRef}
//                 dots={false}
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows={false}
//                 initialSlide={fullScreenImageIndex}
//                 afterChange={setFullScreenImageIndex}
//               >
//                 {displayedImages.map((img, index) => (
//                   <div key={index} className="full-screen-slide">
//                     <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} wheel={{ step: 0.1 }} pinch={{ step: 5 }}>
//                       {({ zoomIn, zoomOut, resetTransform }) => (
//                         <>
//                           <TransformComponent wrapperClass="transform-wrapper">
//                             {imageLoadingStates[index] && (
//                               <div className="image-loading-spinner">
//                                 <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                   <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                                 </svg>
//                               </div>
//                             )}
//                             <img
//                               src={img}
//                               alt={`${productName} ${index + 1}`}
//                               onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                               onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [index]: false }))}
//                               className="full-screen-image-content"
//                               loading="eager"
//                             />
//                           </TransformComponent>
//                           <div className="zoom-controls">
//                             <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                               +
//                             </button>
//                             <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                               -
//                             </button>
//                             <button className="zoom-btn" onClick={() => resetTransform()} aria-label="Reset zoom">
//                               ↺
//                             </button>
//                           </div>
//                         </>
//                       )}
//                     </TransformWrapper>
//                   </div>
//                 ))}
//               </Slider>
//               {displayedImages.length > 1 && (
//                 <>
//                   <button
//                     className="full-screen-nav-btn prev"
//                     onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                     aria-label="Previous"
//                   >
//                     ❮
//                   </button>
//                   <button
//                     className="full-screen-nav-btn next"
//                     onClick={() => fullScreenSliderRef.current?.slickNext()}
//                     aria-label="Next"
//                   >
//                     ❯
//                   </button>
//                   <div className="full-screen-dots">
//                     {displayedImages.map((_, index) => (
//                       <button
//                         key={index}
//                         className={`full-screen-dot ${index === fullScreenImageIndex ? 'active' : ''}`}
//                         onClick={() => fullScreenSliderRef.current?.slickGoTo(index)}
//                         aria-label={`Go to image ${index + 1}`}
//                         aria-current={index === fullScreenImageIndex}
//                       />
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//             <button
//               className="full-screen-close-btn"
//               onClick={handleCloseFullScreen}
//               aria-label="Close full screen viewer"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <div className="ratings-reviews-section">
//           <h3>Ratings & Reviews</h3>
//           <div className="rating-score">
//             <StarRatingDisplay rating={averageRating} />
//             <span className="rating-count">
//               ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//             </span>
//           </div>
//           {reviews.length > 0 ? (
//             reviews.map((review) => (
//               <div key={review.id} className="review-item">
//                 <div className="review-header">
//                   <span className="review-author">{review.reviewer_name}</span>
//                   <StarRatingDisplay rating={review.rating} />
//                 </div>
//                 <p className="review-text">{review.review_text}</p>
//                 {review.reply_text && <p className="review-reply">Seller Reply: {review.reply_text}</p>}
//                 <time className="review-date" dateTime={review.created_at}>
//                   {new Date(review.created_at).toLocaleDateString('en-IN', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                   })}
//                 </time>
//               </div>
//             ))
//           ) : (
//             <p className="no-reviews">No reviews yet.</p>
//           )}
//         </div>

//         <div className="specifications-section">
//           <h3>Specifications</h3>
//           {product.specifications && Object.keys(product.specifications).length > 0 ? (
//             <div className="specifications-list">
//               {Object.entries(product.specifications).map(([key, value], index) => (
//                 <div key={index} className="spec-item">
//                   <span className="spec-key" data-full-text={key}>{key}</span>
//                   <span className="spec-value" data-full-text={value}>{value}</span>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="no-specs">No specifications available.</p>
//           )}
//         </div>

//         <div className="related-products-section">
//           <h3>Related Products</h3>
//           {isRelatedLoading ? (
//             <div className="related-products-loading">
//               <p>Fetching related products...</p>
//               <div className="related-products-grid">
//                 {[...Array(4)].map((_, index) => (
//                   <div key={index} className="related-product-skeleton">
//                     <div className="skeleton-image" />
//                     <div className="skeleton-text" />
//                     <div className="skeleton-text short" />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ) : relatedProducts.length > 0 ? (
//             <div className="related-products-grid">
//               {relatedProducts.map((item, index) => (
//                 <div
//                   key={item.id}
//                   className="related-product-card"
//                   onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                   role="button"
//                   tabIndex={0}
//                   onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                   aria-label={`View ${item.title} in ${item.category_name}`}
//                   style={{ animationDelay: `${index * 0.1}s` }}
//                 >
//                   <div className="related-product-image-wrapper">
//                     {item.discount_amount > 0 && (
//                       <span className="related-offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save {formatCurrency(item.discount_amount)}
//                       </span>
//                     )}
//                     <img
//                       src={item.images?.[0] || DEFAULT_IMAGE}
//                       alt={item.title}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="related-product-image"
//                       loading="lazy"
//                     />
//                   </div>
//                   <div className="related-product-info">
//                     <h4 className="related-product-title">{item.title}</h4>
//                     <div className="related-product-price-section">
//                       <p className="related-product-price">{formatCurrency(item.price)}</p>
//                       {item.original_price && item.original_price > item.price && (
//                         <p className="related-product-original-price">{formatCurrency(item.original_price)}</p>
//                       )}
//                     </div>
//                     <p className="related-product-category">{item.category_name}</p>
//                     {item.distance != null && (
//                       <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="related-products-empty">
//               <p className="no-specs">No related products available in your area.</p>
//               <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//             </div>
//           )}
//         </div>

//         <img src={icon} alt="Markeet Logo" className="product-icon" />
//       </div>
//     );
//   };

//   return (
//     <ErrorBoundary>
//       <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION, ariaProps: { role: 'alert', 'aria-live': 'assertive' } }} />
//       {renderContent()}
//     </ErrorBoundary>
//   );
// }

// export default React.memo(ProductPage);



// import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
// import { useParams, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import { LocationContext } from '../App';
// import { useEnhancedNavigation } from '../hooks/scrollManager';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';
// import { FaShoppingCart, FaCrown } from 'react-icons/fa';
// import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// // Constants
// const DEFAULT_IMAGE = 'https://dummyimage.com/300';
// const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
// const CACHE_KEY = 'relatedCache';
// const TOAST_STYLES = {
//   error: {
//     background: '#ff4d4f',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   success: {
//     background: '#10b981',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
//   loading: {
//     background: '#3b82f6',
//     color: '#fff',
//     fontWeight: '500',
//     borderRadius: 'var(--border-radius)',
//     padding: 'calc(var(--spacing-unit) * 2)',
//   },
// };
// const TOAST_DURATION = 4000;
// const MAX_LOCATION_RETRIES = 3;
// const MIN_LOADING_DURATION = 500;
// const DEFAULT_DELIVERY_RADIUS = 40;

// // Utility Functions
// const formatCurrency = (value) => formatPrice(value);

// const calculateDistance = (userLoc, sellerLoc) => {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     return null;
//   }
//   const R = 6371; // Earth's radius in km
//   const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return parseFloat((R * c).toFixed(2));
// };

// const shuffleArray = (array) => {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// const safeParseJSON = (key, defaultValue) => {
//   const item = localStorage.getItem(key);
//   if (item === null || item === 'undefined') {
//     return defaultValue;
//   }
//   try {
//     return JSON.parse(item) || defaultValue;
//   } catch (err) {
//     return defaultValue;
//   }
// };

// const formatSpecValue = (value) => {
//   if (value === null || value === undefined) return 'N/A';
//   if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
//     return String(value);
//   }
//   if (typeof value === 'object') {
//     return JSON.stringify(value, null, 2).replace(/[{}[\]]/g, '').trim();
//   }
//   return 'N/A';
// };

// // Error Boundary Component
// class ErrorBoundary extends React.Component {
//   state = { hasError: false, error: null };

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="error" role="alert" aria-live="assertive">
//           <h2>Something went wrong</h2>
//           <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
//           <div className="error-actions">
//             <button
//               onClick={() => window.location.reload()}
//               className="retry-btn"
//               aria-label="Retry loading page"
//             >
//               Retry
//             </button>
//             <button
//               onClick={() => window.location.href = '/products'}
//               className="back-btn"
//               aria-label="Go to products"
//             >
//               Browse Products
//             </button>
//           </div>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// // StarRatingDisplay Component
// const StarRatingDisplay = React.memo(({ rating = 0 }) => (
//   <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
//     {[1, 2, 3, 4, 5].map((star) => (
//       <span
//         key={star}
//         className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         aria-hidden="true"
//       >
//         ★
//       </span>
//     ))}
//   </div>
// ));

// function ProductPage() {
//   const { id } = useParams();
//   const location = useLocation();
//   const { navigate, goBack: navigateBack, navigateToCategory } = useEnhancedNavigation();
//   const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

//   // State
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [locationLoading, setLocationLoading] = useState(false);
//   const [locationRetries, setLocationRetries] = useState(0);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [isRelatedLoading, setIsRelatedLoading] = useState(false);
//   const [cart, setCart] = useState(() => safeParseJSON('cart', []));
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);

//   // Memoized Values
//   const getActiveVariant = useMemo(
//     () =>
//       variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
//         ? variants[selectedVariantIndex]
//         : null,
//     [variants, selectedVariantIndex]
//   );

//   const getDisplayedImages = useMemo(() => {
//     const productImages = product?.images || [];
//     const variantImages = getActiveVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
//   }, [product?.images, getActiveVariant]);

//   const isOutOfStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock <= 0;
//   }, [product?.stock, getActiveVariant]);

//   const isLowStock = useMemo(() => {
//     const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
//     return stock > 0 && stock < 5;
//   }, [product?.stock, getActiveVariant]);

//   const getPriceInfo = useMemo(() => {
//     const item = getActiveVariant || product;
//     if (!item) return null;
//     return getPriceDisplayInfo(item);
//   }, [product, getActiveVariant]);

//   const averageRating = useMemo(() => {
//     return reviews.length > 0
//       ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//       : 0;
//   }, [reviews]);

//   const variantAttributes = useMemo(() =>
//     variants
//       .map((v, index) => ({
//         id: v.id,
//         index,
//         attributes: Object.entries(v.attributes || {})
//           .filter(([key, val]) => val && val.toString().trim() && key !== 'attribute1')
//           .map(([key, val]) => `${key}: ${val}`)
//           .join(', '),
//       }))
//       .filter((v) => v.attributes),
//     [variants]
//   );

//   // Callbacks
//   const checkNetworkStatus = useCallback(() => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return false;
//     }
//     return true;
//   }, []);

//   const retryLocationDetection = useCallback(() => {
//     if (locationLoading || locationRetries >= MAX_LOCATION_RETRIES) {
//       if (locationRetries >= MAX_LOCATION_RETRIES) {
//         const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//         setBuyerLocation(defaultLocation);
//         setLocationLoading(false);
//         setLocationRetries(0);
//         try {
//           localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//         } catch (err) {
//         }
//         toast.error('Maximum location attempts reached. Using default location (Bengaluru).', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//       return;
//     }

//     setLocationLoading(true);
//     setLocationRetries((prev) => prev + 1);

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const detectedLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
//           setBuyerLocation(detectedLocation);
//           setLocationLoading(false);
//           setLocationRetries(0);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(detectedLocation));
//           } catch (err) {
//           }
//         },
//         (error) => {
//           const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//           setBuyerLocation(defaultLocation);
//           setLocationLoading(false);
//           try {
//             localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//           } catch (err) {
//           }
//           toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
//             duration: TOAST_DURATION,
//             position: 'top-center',
//             style: TOAST_STYLES.error,
//           });
//         },
//         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLocation = { lat: 12.9716, lon: 77.5946 };
//       setBuyerLocation(defaultLocation);
//       setLocationLoading(false);
//       try {
//         localStorage.setItem('buyerLocation', JSON.stringify(defaultLocation));
//       } catch (err) {
//       }
//       toast.error('Geolocation not supported. Using default location (Bengaluru).', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     }
//   }, [locationRetries, setBuyerLocation]);

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id, rating, review_text, reply_text, created_at,
//           profiles!reviews_reviewer_id_fkey(full_name)
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });
//       if (reviewsError) throw new Error(`Reviews fetch error: ${reviewsError.message}`);

//       return (reviewsData || []).map((review) => ({
//         ...review,
//         reviewer_name: review.profiles?.full_name || 'Anonymous',
//       }));
//     } catch (err) {
//       toast.error('Failed to load reviews. Please try again later.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     if (!checkNetworkStatus()) {
//       setError('No internet connection.');
//       setLoading(false);
//       return;
//     }

//     if (!id || isNaN(parseInt(id, 10))) {
//       setError('Invalid product ID.');
//       setLoading(false);
//       toast.error('Invalid product ID.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//       navigate('/products');
//       return;
//     }

//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       retryLocationDetection();
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     const startTime = Date.now();

//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           id, title, description, price, original_price, discount_amount, images, stock, status,
//           delivery_radius_km, latitude, longitude, specifications, seller_id,
//           sellers(id, store_name, latitude, longitude),
//           categories(id, name, is_restricted, max_delivery_radius_km)
//         `)
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .is('deleted_at', null)
//         .maybeSingle();
//       if (productError) throw new Error(`Product fetch error: ${productError.message}`);
//       if (!productData) {
//         throw new Error('Product not found.');
//       }

//       const distance = calculateDistance(buyerLocation, {
//         latitude: productData.sellers?.latitude || productData.latitude,
//         longitude: productData.sellers?.longitude || productData.longitude,
//       });
//       const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//       if (distance === null || distance > effectiveRadius) {
//         setError(`Product not available in your area (${distance?.toFixed(2) || 'unknown'} km > ${effectiveRadius} km).`);
//         toast.error(`Product not available in your area.`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         navigate('/products');
//         return;
//       }

//       // Restricted products should behave normally on product page; no blocking or special toasts

//       const normalizedSpecifications = {};
//       if (productData.specifications && typeof productData.specifications === 'object') {
//         Object.entries(productData.specifications).forEach(([key, value]) => {
//           normalizedSpecifications[key] = formatSpecValue(value);
//         });
//       }

//       const normalizedProduct = {
//         ...productData,
//         price: parseFloat(productData.price) || parseFloat(productData.original_price - (productData.discount_amount || 0)) || 0,
//         original_price: parseFloat(productData.original_price) || null,
//         discount_amount: parseFloat(productData.discount_amount) || 0,
//         category_name: productData.categories?.name || 'Unknown Category',
//         category_id: productData.categories?.id || null,
//         images: Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean) || [DEFAULT_IMAGE],
//         specifications: normalizedSpecifications,
//       };
//       setProduct(normalizedProduct);
//       setIsRestricted(productData.categories?.is_restricted || false);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images, status')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active')
//         .is('deleted_at', null);
//       if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

//       const validVariants = (variantData || [])
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: parseFloat(variant.original_price) || null,
//           discount_amount: parseFloat(variant.discount_amount) || 0,
//           stock: variant.stock ?? 0,
//           images: Array.isArray(variant.images) ? variant.images : [variant.images].filter(Boolean) || normalizedProduct.images,
//         }))
//         .filter((variant) => {
//           const attributes = variant.attributes || {};
//           return Object.values(attributes).some((val) => val && val.toString().trim());
//         });
//       setVariants(validVariants);
//       setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

//       const reviewsData = await fetchProductReviews(parseInt(id, 10));
//       setReviews(reviewsData);

//       const elapsed = Date.now() - startTime;
//       const remaining = MIN_LOADING_DURATION - elapsed;
//       if (remaining > 0) {
//         await new Promise((resolve) => setTimeout(resolve, remaining));
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to load product.');
//       toast.error(err.message || 'Failed to load product.', {
//         duration: TOAST_DURATION,
//         position: 'top-center',
//         style: TOAST_STYLES.error,
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, buyerLocation, fetchProductReviews, navigate, navigateToCategory, location.state, checkNetworkStatus, retryLocationDetection, locationLoading]);

//   const fetchRelatedProducts = useCallback(
//     async (currentProduct, retryCount = 0) => {
//       if (!currentProduct?.id || !currentProduct.category_id || !checkNetworkStatus()) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         return;
//       }

//       if (!buyerLocation?.lat || !buyerLocation?.lon) {
//         setRelatedProducts([]);
//         setIsRelatedLoading(false);
//         toast.error('Location required to show related products. Please enable location or retry.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         retryLocationDetection();
//         return;
//       }

//       setIsRelatedLoading(true);
//       const cacheKey = `${currentProduct.id}-${currentProduct.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
//       const relatedCache = safeParseJSON(CACHE_KEY, {});

//       if (relatedCache[cacheKey]) {
//         setRelatedProducts(shuffleArray(relatedCache[cacheKey]));
//         setIsRelatedLoading(false);
//         return;
//       }

//       try {
//         const { data: nonRestrictedCategories, error: categoryError } = await supabase
//           .from('categories')
//           .select('id')
//           .eq('is_restricted', false);
//         if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
//         const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

//         const isCategoryRestricted = !nonRestrictedCategoryIds.includes(currentProduct.category_id);
//         if (isCategoryRestricted && !location.state?.fromCategories) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const { data: relatedData, error: relatedError } = await supabase
//           .from('products')
//           .select(`
//             id, title, price, original_price, discount_amount, images, seller_id, category_id,
//             delivery_radius_km, categories(name, max_delivery_radius_km),
//             sellers(latitude, longitude)
//           `)
//           .eq('category_id', currentProduct.category_id)
//           .neq('id', currentProduct.id)
//           .eq('is_approved', true)
//           .eq('status', 'active')
//           .is('deleted_at', null)
//           .limit(10);
//         if (relatedError) throw new Error(`Related products fetch error: ${relatedError.message}`);

//         if (!relatedData || relatedData.length === 0) {
//           setRelatedProducts([]);
//           setIsRelatedLoading(false);
//           return;
//         }

//         const validRelatedData = relatedData.filter((item) => item.category_id != null);
//         let categoryData = [];
//         if (validRelatedData.some((item) => !item.categories?.max_delivery_radius_km)) {
//           const categoryIds = [...new Set(validRelatedData.map((item) => item.category_id))];
//           const { data: fetchedCategoryData, error: catDataError } = await supabase
//             .from('categories')
//             .select('id, max_delivery_radius_km')
//             .in('id', categoryIds);
//           if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);
//           categoryData = fetchedCategoryData || [];
//         }

//         const normalized = validRelatedData
//           .map((item) => {
//             const seller = item.sellers || {};
//             const maxDeliveryRadius =
//               item.categories?.max_delivery_radius_km ||
//               categoryData.find((c) => c.id === item.category_id)?.max_delivery_radius_km ||
//               DEFAULT_DELIVERY_RADIUS;
//             const distance = calculateDistance(buyerLocation, {
//               latitude: seller.latitude || item.latitude,
//               longitude: seller.longitude || item.longitude,
//             });
//             return {
//               ...item,
//               price: parseFloat(item.price) || parseFloat(item.original_price - (item.discount_amount || 0)) || 0,
//               original_price: parseFloat(item.original_price) || null,
//               discount_amount: parseFloat(item.discount_amount) || 0,
//               category_name: item.categories?.name || 'Unknown Category',
//               images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean) || [DEFAULT_IMAGE],
//               deliveryRadius: maxDeliveryRadius,
//               distance: distance != null ? parseFloat(distance.toFixed(2)) : null,
//             };
//           })
//           .filter((item) => {
//             if (item.id === currentProduct.id) return false;
//             const effectiveRadius = currentProduct.delivery_radius_km || currentProduct.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
//             return item.distance != null && item.distance <= effectiveRadius && !(isCategoryRestricted && !location.state?.fromCategories);
//           });

//         const shuffled = shuffleArray(normalized).slice(0, 8);
//         relatedCache[cacheKey] = shuffled;
//         try {
//           localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache));
//         } catch (err) {
//         }
//         setRelatedProducts(shuffled);
//       } catch (err) {
//         if (retryCount < 2) {
//           setTimeout(() => fetchRelatedProducts(currentProduct, retryCount + 1), 1000);
//           return;
//         }
//         toast.error('Unable to load related products.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         setRelatedProducts([]);
//       } finally {
//         setIsRelatedLoading(false);
//       }
//     },
//     [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection]
//   );

//   const handleImageClick = useCallback(
//     (index) => {
//       setFullScreenImageIndex(index);
//       setIsFullScreenOpen(true);
//       setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//       const images = getDisplayedImages;
//       const preloadIndices = [
//         index,
//         index === 0 ? images.length - 1 : index - 1,
//         index === images.length - 1 ? 0 : index + 1,
//       ];
//       preloadIndices.forEach((i) => {
//         const img = new Image();
//         img.src = images[i];
//       });
//     },
//     [getDisplayedImages]
//   );

//   const handleCloseFullScreen = useCallback(() => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   }, []);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (!isFullScreenOpen) return;
//       if (e.key === 'Escape') handleCloseFullScreen();
//       else if (e.key === 'ArrowLeft') fullScreenSliderRef.current?.slickPrev();
//       else if (e.key === 'ArrowRight') fullScreenSliderRef.current?.slickNext();
//     },
//     [isFullScreenOpen, handleCloseFullScreen]
//   );

//   const addToCart = useCallback(
//     async (redirectToCart = false) => {
//       if (!product || isOutOfStock) {
//         toast.error(isOutOfStock ? 'This item is out of stock.' : 'Product not available.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }
//       // Restricted products behave normally; no blocking

//       const activeVariant = getActiveVariant;
//       const variantId = activeVariant ? activeVariant.id : null;

//       if (variantId != null && !Number.isInteger(variantId)) {
//         toast.error('Invalid variant selection.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//         return;
//       }

//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages,
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           let query = supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id);

//           if (variantId != null) query = query.eq('variant_id', variantId);
//           else query = query.is('variant_id', null);

//           const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
//           if (fetchError && fetchError.code !== 'PGRST116') {
//             throw new Error('Failed to check cart');
//           }

//           const newQuantity = (existingCartItem?.quantity || 0) + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: TOAST_DURATION,
//               position: 'top-center',
//               style: TOAST_STYLES.error,
//             });
//             return;
//           }

//           if (existingCartItem) {
//             const { data, error: upsertError } = await supabase
//               .from('cart')
//               .update({ quantity: newQuantity })
//               .eq('id', existingCartItem.id)
//               .select()
//               .single();
//             if (upsertError) throw new Error('Failed to update cart');
//             cartItem.cartId = data.id;
//           } else {
//             const { data, error: insertError } = await supabase
//               .from('cart')
//               .insert({
//                 user_id: userId,
//                 product_id: product.id,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               })
//               .select()
//               .single();
//             if (insertError) throw new Error('Failed to add to cart');
//             cartItem.cartId = data.id;
//           }
//         }

//         const existingLocalItemIndex = cart.findIndex((item) => item.uniqueKey === cartItem.uniqueKey);
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
//               : item
//           );
//         } else {
//           updatedCart = [...cart, cartItem];
//         }

//         setCart(updatedCart);
//         try {
//           localStorage.setItem('cart', JSON.stringify(updatedCart));
//         } catch (err) {
//         }
//         toast.success(`${cartItem.title} added to cart!`, {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.success,
//         });

//         if (redirectToCart) {
//           toast.loading('Redirecting to cart...', {
//             duration: 2000,
//             position: 'top-center',
//             style: TOAST_STYLES.loading,
//           });
//           setTimeout(() => navigate('/cart'), 2000);
//         }
//       } catch (err) {
//         toast.error('Failed to add to cart. Please try again.', {
//           duration: TOAST_DURATION,
//           position: 'top-center',
//           style: TOAST_STYLES.error,
//         });
//       }
//     },
//     [product, cart, navigate, navigateToCategory, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock]
//   );

//   // Effects
//   useEffect(() => {
//     const storedLocation = safeParseJSON('buyerLocation', null);
//     if (storedLocation?.lat && storedLocation?.lon) {
//       setBuyerLocation(storedLocation);
//     } else {
//       retryLocationDetection();
//     }
//   }, [setBuyerLocation, retryLocationDetection]);

//   useEffect(() => {
//     if (!id || !buyerLocation?.lat || !buyerLocation?.lon || locationLoading) {
//       return;
//     }
//     let isMounted = true;
//     fetchProductAndVariants().then(() => {
//       if (!isMounted) return;
//     });
//     return () => {
//       isMounted = false;
//     };
//   }, [id, buyerLocation, locationLoading, fetchProductAndVariants]);

//   useEffect(() => {
//     if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
//       fetchRelatedProducts(product);
//     }
//   }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

//   useEffect(() => {
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [handleKeyDown]);

//   // Render
//   const renderContent = () => {
//     if (loading || locationLoading) {
//       return (
//         <div className="td-loading-container">
//           <div className="td-loading-animation">
//             <div className="td-loading-box">
//               <FaShoppingCart className="td-loading-icon" />
//               <span>Getting your product ready…</span>
//             </div>
//             <div className="td-loading-dots">
//               <span>.</span>
//               <span>.</span>
//               <span>.</span>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (error || !product) {
//       return (
//         <div className="error" role="alert" aria-live="assertive">
//           <h2>Product not found</h2>
//           <p>{error || 'The requested product could not be loaded.'}</p>
//           <div className="error-actions">
//             <button
//               onClick={retryLocationDetection}
//               className="retry-btn"
//               aria-label="Retry location detection"
//               disabled={locationLoading}
//             >
//               Retry Location
//             </button>
//             <button
//               onClick={() => navigate('/products')}
//               className="back-btn"
//               aria-label="Back to products"
//             >
//               Browse Products
//             </button>
//           </div>
//         </div>
//       );
//     }

//     const displayedImages = getDisplayedImages;
//     const productName = product.title || product.name || 'Product';
//     const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
//     const productUrl = `https://www.markeet.com/product/${id}`;
//     const availability = isOutOfStock ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';

//     return (
//       <div className="product-page-container loaded">
//         <Helmet>
//           <title>{`${productName} - Markeet`}</title>
//           <meta name="description" content={productDescription} />
//           <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
//           <link rel="canonical" href={productUrl} />
//           <meta property="og:title" content={`${productName} - Markeet`} />
//           <meta property="og:description" content={productDescription} />
//           <meta property="og:image" content={displayedImages[0] || DEFAULT_IMAGE} />
//           <meta property="og:url" content={productUrl} />
//           <meta property="og:type" content="product" />
//           <script type="application/ld+json">
//             {JSON.stringify({
//               '@context': 'https://schema.org',
//               '@type': 'Product',
//               name: productName,
//               description: productDescription,
//               image: displayedImages,
//               category: product.category_name,
//               offers: {
//                 '@type': 'Offer',
//                 price: (getActiveVariant?.price || product.price) / 100,
//                 priceCurrency: 'INR',
//                 availability,
//                 seller: {
//                   '@type': 'Organization',
//                   name: product.sellers?.store_name || 'Markeet Seller',
//                 },
//               },
//               aggregateRating: reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: reviews.length,
//                   }
//                 : null,
//               review: reviews.map((r) => ({
//                 '@type': 'Review',
//                 author: { '@type': 'Person', name: r.reviewer_name },
//                 reviewRating: { '@type': 'Rating', ratingValue: r.rating },
//                 reviewBody: r.review_text,
//                 datePublished: r.created_at,
//               })),
//             })}
//           </script>
//         </Helmet>

//         <button
//           onClick={() => {
//             const state = location.state || {};
//             if (state.fromCategory && state.categoryId) {
//               navigateToCategory(`/products?category=${state.categoryId}`, { state: { ...state, fromCategories: true } });
//             } else {
//               navigateBack();
//             }
//           }}
//           className="enhanced-back-btn"
//           aria-label="Back to previous page"
//         >
//           ← Back
//         </button>

//         <div className="main-content">
//           <div className="product-image-section">
//             <div className="image-slider-container">
//               {displayedImages.length > 1 ? (
//                 <Slider
//                   dots
//                   infinite
//                   speed={500}
//                   slidesToShow={1}
//                   slidesToScroll={1}
//                   arrows
//                   autoplay={false}
//                   className="image-slider"
//                 >
//                   {displayedImages.map((img, index) => (
//                     <div key={index} className="slider-image-wrapper">
//                       <img
//                         src={img}
//                         alt={`${productName} ${index + 1}`}
//                         onClick={() => handleImageClick(index)}
//                         onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                         className="clickable-image"
//                         role="button"
//                         tabIndex={0}
//                         aria-label={`View ${productName} ${index + 1} in full screen`}
//                         onKeyDown={(e) => e.key === 'Enter' && handleImageClick(index)}
//                         loading="lazy"
//                       />
//                     </div>
//                   ))}
//                 </Slider>
//               ) : (
//                 <div className="single-image-wrapper">
//                   <img
//                     src={displayedImages[0]}
//                     alt={productName}
//                     onClick={() => handleImageClick(0)}
//                     onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                     className="clickable-image"
//                     role="button"
//                     tabIndex={0}
//                     aria-label={`View ${productName} in full screen`}
//                     onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
//                     loading="lazy"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="product-details-section">
//             <h1 className="product-title">{productName}</h1>
//             <div className={`price-section ${getPriceInfo?.hasDiscount ? 'offer-highlight' : ''}`}>
//               {getPriceInfo?.hasDiscount && <span className="deal-label">Special Offer</span>}
//               <div className="price-details">
//                 <span className="current-price">{getPriceInfo?.formattedFinal}</span>
//                 {getPriceInfo?.hasDiscount && (
//                   <>
//                     <span className="original-price">{getPriceInfo?.formattedOriginal}</span>
//                     <span className="discount">Save {getPriceInfo?.formattedSavings}</span>
//                   </>
//                 )}
//               </div>
//             </div>
//             {isLowStock && (
//               <p className="low-stock-warning" aria-live="polite">
//                 Hurry! Only {getActiveVariant?.stock || product.stock} left in stock.
//               </p>
//             )}
//             {isOutOfStock && (
//               <p className="low-stock-warning" aria-live="polite">
//                 Out of stock
//               </p>
//             )}
//             <ul className="product-highlights">
//               {product.description?.split(';').filter(Boolean).map((point, index) => (
//                 <li key={index}>{point.trim()}</li>
//               )) || <li>No description available.</li>}
//             </ul>
//             {variantAttributes.length > 0 && (
//               <div className="variant-section">
//                 <h4 id="variant-section-label">Select Variant</h4>
//                 <div role="radiogroup" aria-labelledby="variant-section-label" className="variant-options">
//                   {variantAttributes.map((v) => (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => setSelectedVariantIndex(v.index)}
//                       aria-label={`Select variant: ${v.attributes || 'Default'}`}
//                       role="radio"
//                       aria-checked={v.index === selectedVariantIndex}
//                       disabled={variants[v.index].stock <= 0}
//                     >
//                       {v.attributes || 'Default'}
//                       {variants[v.index].stock <= 5 && variants[v.index].stock > 0 && (
//                         <span> (Low stock: {variants[v.index].stock})</span>
//                       )}
//                       {variants[v.index].stock === 0 && <span> (Out of stock)</span>}
//                     </button>
//                   ))}
//                 </div>
//                 {getActiveVariant && (
//                   <p className="variant-price-info">
//                     Selected variant price: {formatCurrency(getActiveVariant.price)}
//                   </p>
//                 )}
//               </div>
//             )}
//             <div className="action-buttons">
//               <button
//                 onClick={() => addToCart(false)}
//                 className="add-to-cart-button"
//                 disabled={isOutOfStock}
//                 aria-label={`Add ${productName} to cart`}
//               >
//                 {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
//               </button>
//               <button
//                 onClick={() => addToCart(true)}
//                 className="buy-now-button"
//                 disabled={isOutOfStock}
//                 aria-label={`Buy ${productName} now`}
//               >
//                 Buy Now
//               </button>
//             </div>
//             <div className="seller-info">
//               <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//               <Link
//                 to={`/seller/${product.seller_id}`}
//                 className="seller-link"
//                 aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
//               >
//                 View Seller Profile
//               </Link>
//             </div>
//           </div>
//         </div>

//         {isFullScreenOpen && (
//           <div
//             className="full-screen-image"
//             role="dialog"
//             aria-label="Full screen viewer"
//             onClick={handleCloseFullScreen}
//           >
//             <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//               <Slider
//                 ref={fullScreenSliderRef}
//                 dots={false}
//                 infinite
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 arrows={false}
//                 initialSlide={fullScreenImageIndex}
//                 afterChange={setFullScreenImageIndex}
//               >
//                 {displayedImages.map((img, index) => (
//                   <div key={index} className="full-screen-slide">
//                     <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} wheel={{ step: 0.1 }} pinch={{ step: 5 }}>
//                       {({ zoomIn, zoomOut, resetTransform }) => (
//                         <>
//                           <TransformComponent wrapperClass="transform-wrapper">
//                             {imageLoadingStates[index] && (
//                               <div className="image-loading-spinner">
//                                 <svg className="premium-spinner" viewBox="0 0 50 50" aria-hidden="true">
//                                   <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                                 </svg>
//                               </div>
//                             )}
//                             <img
//                               src={img}
//                               alt={`${productName} ${index + 1}`}
//                               onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
//                               onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [index]: false }))}
//                               className="full-screen-image-content"
//                               loading="eager"
//                             />
//                           </TransformComponent>
//                           <div className="zoom-controls">
//                             <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
//                               +
//                             </button>
//                             <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
//                               -
//                             </button>
//                             <button className="zoom-btn" onClick={() => resetTransform()} aria-label="Reset zoom">
//                               ↺
//                             </button>
//                           </div>
//                         </>
//                       )}
//                     </TransformWrapper>
//                   </div>
//                 ))}
//               </Slider>
//               {displayedImages.length > 1 && (
//                 <>
//                   <button
//                     className="full-screen-nav-btn prev"
//                     onClick={() => fullScreenSliderRef.current?.slickPrev()}
//                     aria-label="Previous"
//                   >
//                     ❮
//                   </button>
//                   <button
//                     className="full-screen-nav-btn next"
//                     onClick={() => fullScreenSliderRef.current?.slickNext()}
//                     aria-label="Next"
//                   >
//                     ❯
//                   </button>
//                   <div className="full-screen-dots">
//                     {displayedImages.map((_, index) => (
//                       <button
//                         key={index}
//                         className={`full-screen-dot ${index === fullScreenImageIndex ? 'active' : ''}`}
//                         onClick={() => fullScreenSliderRef.current?.slickGoTo(index)}
//                         aria-label={`Go to image ${index + 1}`}
//                         aria-current={index === fullScreenImageIndex}
//                       />
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//             <button
//               className="full-screen-close-btn"
//               onClick={handleCloseFullScreen}
//               aria-label="Close full screen viewer"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <div className="ratings-reviews-section">
//           <h3>Ratings & Reviews</h3>
//           <div className="rating-score">
//             <StarRatingDisplay rating={averageRating} />
//             <span className="rating-count">
//               ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
//             </span>
//           </div>
//           {reviews.length > 0 ? (
//             reviews.map((review) => (
//               <div key={review.id} className="review-item">
//                 <div className="review-header">
//                   <span className="review-author">{review.reviewer_name}</span>
//                   <StarRatingDisplay rating={review.rating} />
//                 </div>
//                 <p className="review-text">{review.review_text}</p>
//                 {review.reply_text && <p className="review-reply">Seller Reply: {review.reply_text}</p>}
//                 <time className="review-date" dateTime={review.created_at}>
//                   {new Date(review.created_at).toLocaleDateString('en-IN', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                   })}
//                 </time>
//               </div>
//             ))
//           ) : (
//             <p className="no-reviews">No reviews yet.</p>
//           )}
//         </div>

//         <div className="specifications-section">
//           <h3>Specifications</h3>
//           {product.specifications && Object.keys(product.specifications).length > 0 ? (
//             <div className="specifications-list">
//               {Object.entries(product.specifications).map(([key, value], index) => (
//                 <div key={index} className="spec-item">
//                   <span className="spec-key" data-full-text={key}>{key}</span>
//                   <span className="spec-value" data-full-text={value}>{value}</span>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="no-specs">No specifications available.</p>
//           )}
//         </div>

//         <div className="related-products-section">
//           <h3>Related Products</h3>
//           {isRelatedLoading ? (
//             <div className="related-products-loading">
//               <p>Fetching related products...</p>
//               <div className="related-products-grid">
//                 {[...Array(4)].map((_, index) => (
//                   <div key={index} className="related-product-skeleton">
//                     <div className="skeleton-image" />
//                     <div className="skeleton-text" />
//                     <div className="skeleton-text short" />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ) : relatedProducts.length > 0 ? (
//             <div className="related-products-grid">
//               {relatedProducts.map((item, index) => (
//                 <div
//                   key={item.id}
//                   className="related-product-card"
//                   onClick={() => navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                   role="button"
//                   tabIndex={0}
//                   onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`, { state: { fromCategories: location.state?.fromCategories } })}
//                   aria-label={`View ${item.title} in ${item.category_name}`}
//                   style={{ animationDelay: `${index * 0.1}s` }}
//                 >
//                   <div className="related-product-image-wrapper">
//                     {item.discount_amount > 0 && (
//                       <span className="related-offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save {formatCurrency(item.discount_amount)}
//                       </span>
//                     )}
//                     <img
//                       src={item.images?.[0] || DEFAULT_IMAGE}
//                       alt={item.title}
//                       onError={(e) => (e.target.src = DEFAULT_IMAGE)}
//                       className="related-product-image"
//                       loading="lazy"
//                     />
//                   </div>
//                   <div className="related-product-info">
//                     <h4 className="related-product-title">{item.title}</h4>
//                     <div className="related-product-price-section">
//                       <p className="related-product-price">{formatCurrency(item.price)}</p>
//                       {item.original_price && item.original_price > item.price && (
//                         <p className="related-product-original-price">{formatCurrency(item.original_price)}</p>
//                       )}
//                     </div>
//                     <p className="related-product-category">{item.category_name}</p>
//                     {item.distance != null && (
//                       <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="related-products-empty">
//               <p className="no-specs">No related products available in your area.</p>
//               <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
//             </div>
//           )}
//         </div>

//         <FaCrown className="product-icon premium-icon" aria-label="Markeet Premium" />
//       </div>
//     );
//   };

//   return (
//     <ErrorBoundary>
//       <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION, ariaProps: { role: 'alert', 'aria-live': 'assertive' } }} />
//       {renderContent()}
//     </ErrorBoundary>
//   );
// }

// export default React.memo(ProductPage);



import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { LocationContext } from '../App';
import '../style/ProductPage.css';
import { Helmet } from 'react-helmet-async';
import { FaShoppingCart, FaCrown } from 'react-icons/fa';
import { getPriceDisplayInfo, formatPrice } from '../utils/priceUtils';

// Constants
const DEFAULT_IMAGE = 'https://dummyimage.com/300';
const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
const CACHE_KEY = 'relatedCache';
const TOAST_STYLES = {
  error: { background: '#ff4d4f', color: '#fff', fontWeight: '500', borderRadius: 'var(--border-radius)', padding: 'calc(var(--spacing-unit) * 2)' },
  success: { background: '#10b981', color: '#fff', fontWeight: '500', borderRadius: 'var(--border-radius)', padding: 'calc(var(--spacing-unit) * 2)' },
};
const TOAST_DURATION = 4000;
const MAX_LOCATION_RETRIES = 3;
const MIN_LOADING_DURATION = 500;
const DEFAULT_DELIVERY_RADIUS = 40;

// Utility Functions
const formatCurrency = (value) => formatPrice(value);
const calculateDistance = (userLoc, sellerLoc) => {
  if (!userLoc?.lat || !userLoc?.lon || !sellerLoc?.latitude || !sellerLoc?.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) {
    return null;
  }
  const R = 6371;
  const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLoc.lat * (Math.PI / 180)) * Math.cos(sellerLoc.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const safeParseJSON = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  if (item === null || item === 'undefined') return defaultValue;
  try { return JSON.parse(item) || defaultValue; } catch { return defaultValue; }
};

const formatSpecValue = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value, null, 2).replace(/[{}[\]]/g, '').trim();
  return 'N/A';
};

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error" role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
            <button onClick={() => window.location.href = '/products'} className="back-btn">Browse Products</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Star Rating
const StarRatingDisplay = React.memo(({ rating = 0 }) => (
  <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}>★</span>
    ))}
  </div>
));

function ProductPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { buyerLocation, setBuyerLocation } = useContext(LocationContext);

  // State
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationRetries, setLocationRetries] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [cart, setCart] = useState(() => safeParseJSON('cart', []));
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const fullScreenSliderRef = useRef(null);

  // Memoized Values
  const getActiveVariant = useMemo(() => variants[selectedVariantIndex] || null, [variants, selectedVariantIndex]);
  const getDisplayedImages = useMemo(() => {
    const productImages = product?.images || [];
    const variantImages = getActiveVariant?.images || [];
    const merged = [...new Set([...productImages, ...variantImages])];
    return merged.length > 0 ? merged : [DEFAULT_IMAGE];
  }, [product?.images, getActiveVariant]);

  const isOutOfStock = useMemo(() => (getActiveVariant?.stock ?? product?.stock ?? 0) <= 0, [product?.stock, getActiveVariant]);
  const isLowStock = useMemo(() => {
    const stock = getActiveVariant?.stock ?? product?.stock ?? 0;
    return stock > 0 && stock < 5;
  }, [product?.stock, getActiveVariant]);

  const getPriceInfo = useMemo(() => getPriceDisplayInfo(getActiveVariant || product), [product, getActiveVariant]);
  const averageRating = useMemo(() => reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0, [reviews]);

  const variantAttributes = useMemo(() =>
    variants
      .map((v, i) => ({
        id: v.id,
        index: i,
        attributes: Object.entries(v.attributes || {})
          .filter(([k, val]) => val && val.toString().trim() && k !== 'attribute1')
          .map(([k, val]) => `${k}: ${val}`)
          .join(', '),
      }))
      .filter(v => v.attributes),
    [variants]
  );

  // Callbacks
  const checkNetworkStatus = useCallback(() => {
    if (!navigator.onLine) {
      toast.error('No internet connection.', { duration: TOAST_DURATION, style: TOAST_STYLES.error });
      return false;
    }
    return true;
  }, []);

  const retryLocationDetection = useCallback(() => {
    if (locationLoading || locationRetries >= MAX_LOCATION_RETRIES) {
      if (locationRetries >= MAX_LOCATION_RETRIES) {
        const defaultLoc = { lat: 12.9716, lon: 77.5946 };
        setBuyerLocation(defaultLoc);
        setLocationLoading(false);
        setLocationRetries(0);
        localStorage.setItem('buyerLocation', JSON.stringify(defaultLoc));
        toast.error('Using default location (Bengaluru).', { style: TOAST_STYLES.error });
      }
      return;
    }
    setLocationLoading(true);
    setLocationRetries(p => p + 1);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setBuyerLocation(loc); setLocationLoading(false); setLocationRetries(0);
          localStorage.setItem('buyerLocation', JSON.stringify(loc));
        },
        () => {
          const defaultLoc = { lat: 12.9716, lon: 77.5946 };
          setBuyerLocation(defaultLoc); setLocationLoading(false);
          localStorage.setItem('buyerLocation', JSON.stringify(defaultLoc));
          toast.error('Location failed. Using default (Bengaluru).', { style: TOAST_STYLES.error });
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      const defaultLoc = { lat: 12.9716, lon: 77.5946 };
      setBuyerLocation(defaultLoc); setLocationLoading(false);
      localStorage.setItem('buyerLocation', JSON.stringify(defaultLoc));
      toast.error('Geolocation not supported.', { style: TOAST_STYLES.error });
    }
  }, [locationRetries, setBuyerLocation, locationLoading]);

  const fetchProductReviews = useCallback(async (productId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`id, rating, review_text, reply_text, created_at, profiles!reviews_reviewer_id_fkey(full_name)`)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({ ...r, reviewer_name: r.profiles?.full_name || 'Anonymous' }));
    } catch {
      toast.error('Failed to load reviews.', { style: TOAST_STYLES.error });
      return [];
    }
  }, []);

  const fetchProductAndVariants = useCallback(async () => {
    if (!checkNetworkStatus()) { setError('No internet.'); setLoading(false); return; }
    if (!id || isNaN(parseInt(id, 10))) { setError('Invalid ID.'); setLoading(false); navigate('/products'); return; }
    if (!buyerLocation?.lat || !buyerLocation?.lon) { retryLocationDetection(); return; }

    setLoading(true); setError(null);
    const start = Date.now();
    try {
      const { data: productData, error: pErr } = await supabase
        .from('products')
        .select(`
          id, title, description, price, original_price, discount_amount, images, stock, status,
          delivery_radius_km, latitude, longitude, specifications, seller_id,
          sellers(id, store_name, latitude, longitude),
          categories(id, name, is_restricted, max_delivery_radius_km)
        `)
        .eq('id', parseInt(id, 10))
        .eq('is_approved', true)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle();
      if (pErr || !productData) throw new Error('Product not found.');

      const distance = calculateDistance(buyerLocation, {
        latitude: productData.sellers?.latitude || productData.latitude,
        longitude: productData.sellers?.longitude || productData.longitude,
      });
      const radius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
      if (distance === null || distance > radius) {
        setError(`Not available in your area (${distance?.toFixed(2)} km).`);
        toast.error('Product not available in your area.', { style: TOAST_STYLES.error });
        navigate('/products');
        return;
      }

      const specs = {};
      if (productData.specifications) {
        Object.entries(productData.specifications).forEach(([k, v]) => { specs[k] = formatSpecValue(v); });
      }

      const normalizedProduct = {
        ...productData,
        price: parseFloat(productData.price) || 0,
        original_price: parseFloat(productData.original_price) || null,
        discount_amount: parseFloat(productData.discount_amount) || 0,
        category_name: productData.categories?.name || 'Unknown',
        category_id: productData.categories?.id || null,
        images: Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean) || [DEFAULT_IMAGE],
        specifications: specs,
      };
      setProduct(normalizedProduct);

      const { data: vData, error: vErr } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, discount_amount, stock, attributes, images, status')
        .eq('product_id', parseInt(id, 10))
        .eq('status', 'active')
        .is('deleted_at', null);
      if (vErr) throw vErr;

      const validVariants = (vData || [])
        .map(v => ({
          ...v,
          price: parseFloat(v.price) || 0,
          original_price: parseFloat(v.original_price) || null,
          discount_amount: parseFloat(v.discount_amount) || 0,
          stock: v.stock ?? 0,
          images: Array.isArray(v.images) ? v.images : [v.images].filter(Boolean) || normalizedProduct.images,
        }))
        .filter(v => Object.values(v.attributes || {}).some(val => val && val.toString().trim()));
      setVariants(validVariants);
      setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

      const reviews = await fetchProductReviews(parseInt(id, 10));
      setReviews(reviews);

      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_DURATION) await new Promise(r => setTimeout(r, MIN_LOADING_DURATION - elapsed));
    } catch (err) {
      setError(err.message || 'Failed to load.');
      toast.error(err.message || 'Failed to load.', { style: TOAST_STYLES.error });
    } finally {
      setLoading(false);
    }
  }, [id, buyerLocation, checkNetworkStatus, retryLocationDetection, fetchProductReviews, navigate]);

  const fetchRelatedProducts = useCallback(async (currentProduct) => {
    if (!currentProduct?.id || !currentProduct.category_id || !checkNetworkStatus()) {
      setRelatedProducts([]); setIsRelatedLoading(false); return;
    }
    if (!buyerLocation?.lat || !buyerLocation?.lon) {
      setRelatedProducts([]); setIsRelatedLoading(false);
      toast.error('Location required.', { style: TOAST_STYLES.error });
      retryLocationDetection(); return;
    }

    setIsRelatedLoading(true);
    const cacheKey = `${currentProduct.id}-${currentProduct.category_id}-${Math.round(buyerLocation.lat * 1000)}-${Math.round(buyerLocation.lon * 1000)}`;
    const cache = safeParseJSON(CACHE_KEY, {});
    if (cache[cacheKey]) { setRelatedProducts(shuffleArray(cache[cacheKey])); setIsRelatedLoading(false); return; }

    try {
      const { data: relatedData } = await supabase
        .from('products')
        .select(`
          id, title, price, original_price, discount_amount, images, seller_id, category_id,
          delivery_radius_km, categories(name, max_delivery_radius_km), sellers(latitude, longitude)
        `)
        .eq('category_id', currentProduct.category_id)
        .neq('id', currentProduct.id)
        .eq('is_approved', true)
        .eq('status', 'active')
        .is('deleted_at', null)
        .limit(10);

      if (!relatedData?.length) { setRelatedProducts([]); setIsRelatedLoading(false); return; }

      const normalized = relatedData
        .map(item => {
          const seller = item.sellers || {};
          const maxRadius = item.categories?.max_delivery_radius_km || DEFAULT_DELIVERY_RADIUS;
          const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
          return {
            ...item,
            price: parseFloat(item.price) || 0,
            original_price: parseFloat(item.original_price) || null,
            discount_amount: parseFloat(item.discount_amount) || 0,
            category_name: item.categories?.name || 'Unknown',
            images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean) || [DEFAULT_IMAGE],
            deliveryRadius: maxRadius,
            distance: distance != null ? parseFloat(distance.toFixed(2)) : null,
          };
        })
        .filter(item => item.distance != null && item.distance <= (currentProduct.delivery_radius_km || DEFAULT_DELIVERY_RADIUS));

      const shuffled = shuffleArray(normalized).slice(0, 8);
      cache[cacheKey] = shuffled;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setRelatedProducts(shuffled);
    } catch {
      toast.error('Failed to load related products.', { style: TOAST_STYLES.error });
      setRelatedProducts([]);
    } finally {
      setIsRelatedLoading(false);
    }
  }, [checkNetworkStatus, buyerLocation, retryLocationDetection]);

  const handleImageClick = useCallback((index) => {
    setFullScreenImageIndex(index);
    setIsFullScreenOpen(true);
    setImageLoadingStates(prev => ({ ...prev, [index]: true }));
    const images = getDisplayedImages;
    [index, index === 0 ? images.length - 1 : index - 1, index === images.length - 1 ? 0 : index + 1]
      .forEach(i => { const img = new Image(); img.src = images[i]; });
  }, [getDisplayedImages]);

  const handleCloseFullScreen = useCallback(() => { setIsFullScreenOpen(false); setImageLoadingStates({}); }, []);
  const handleKeyDown = useCallback((e) => {
    if (!isFullScreenOpen) return;
    if (e.key === 'Escape') handleCloseFullScreen();
    else if (e.key === 'ArrowLeft') fullScreenSliderRef.current?.slickPrev();
    else if (e.key === 'ArrowRight') fullScreenSliderRef.current?.slickNext();
  }, [isFullScreenOpen, handleCloseFullScreen]);

  // ADD TO CART + BUY NOW
  const addToCart = useCallback(async (redirectToCart = false) => {
    if (!product || isOutOfStock) {
      toast.error(isOutOfStock ? 'Out of stock.' : 'Product not available.', { style: TOAST_STYLES.error });
      return;
    }

    const activeVariant = getActiveVariant;
    const variantId = activeVariant?.id || null;
    if (variantId != null && !Number.isInteger(variantId)) {
      toast.error('Invalid variant.', { style: TOAST_STYLES.error });
      return;
    }

    const cartItem = {
      id: product.id,
      cartId: null,
      title: product.title || 'Product',
      selectedVariant: activeVariant ? { ...activeVariant } : null,
      variantId,
      price: activeVariant?.price || product.price,
      original_price: activeVariant?.original_price || product.original_price || null,
      discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
      images: getDisplayedImages,
      stock: activeVariant?.stock ?? product.stock,
      quantity: 1,
      uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let updatedCart = [...cart];

      if (session) {
        const userId = session.user.id;
        let query = supabase.from('cart').select('id, quantity').eq('user_id', userId).eq('product_id', product.id);
        if (variantId) query = query.eq('variant_id', variantId); else query = query.is('variant_id', null);
        const { data: existing, error: fetchErr } = await query.maybeSingle();
        if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

        const newQty = (existing?.quantity || 0) + 1;
        if (newQty > cartItem.stock) {
          toast.error('Exceeds stock.', { style: TOAST_STYLES.error });
          return;
        }

        if (existing) {
          const { data } = await supabase.from('cart').update({ quantity: newQty }).eq('id', existing.id).select().single();
          cartItem.cartId = data.id;
        } else {
          const { data } = await supabase.from('cart').insert({
            user_id: userId, product_id: product.id, variant_id: variantId, quantity: 1, price: cartItem.price, title: cartItem.title
          }).select().single();
          cartItem.cartId = data.id;
        }
      }

      const idx = cart.findIndex(i => i.uniqueKey === cartItem.uniqueKey);
      if (idx !== -1) {
        updatedCart = cart.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId } : item);
      } else {
        updatedCart = [...cart, cartItem];
      }

      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      toast.success(`${cartItem.title} added to cart!`, { duration: 1500, style: TOAST_STYLES.success });

      if (redirectToCart) {
        navigate('/cart'); // INSTANT REDIRECT
      }
    } catch {
      toast.error('Failed to add to cart.', { style: TOAST_STYLES.error });
    }
  }, [product, cart, getActiveVariant, getDisplayedImages, isOutOfStock, navigate]);

  // Effects
  useEffect(() => {
    const loc = safeParseJSON('buyerLocation', null);
    if (loc?.lat && loc?.lon) setBuyerLocation(loc); else retryLocationDetection();
  }, [setBuyerLocation, retryLocationDetection]);

  useEffect(() => {
    if (!id || !buyerLocation?.lat || locationLoading) return;
    let mounted = true;
    fetchProductAndVariants().then(() => { if (!mounted) return; });
    return () => { mounted = false; };
  }, [id, buyerLocation, locationLoading, fetchProductAndVariants]);

  useEffect(() => {
    if (product && buyerLocation?.lat && !locationLoading) fetchRelatedProducts(product);
  }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Render
  const renderContent = () => {
    if (loading || locationLoading) {
      return (
        <div className="td-loading-container">
          <div className="td-loading-animation">
            <div className="td-loading-box">
              <FaShoppingCart className="td-loading-icon" />
              <span>Getting your product ready…</span>
            </div>
            <div className="td-loading-dots"><span>.</span><span>.</span><span>.</span></div>
          </div>
        </div>
      );
    }

    if (error || !product) {
      return (
        <div className="error" role="alert">
          <h2>Product not found</h2>
          <p>{error || 'Could not load product.'}</p>
          <div className="error-actions">
            <button onClick={retryLocationDetection} className="retry-btn" disabled={locationLoading}>Retry Location</button>
            <button onClick={() => navigate('/products')} className="back-btn">Browse Products</button>
          </div>
        </div>
      );
    }

    const images = getDisplayedImages;
    const name = product.title || 'Product';
    const desc = product.description?.split(';')[0]?.trim() || `Buy ${name} on Markeet.`;
    const url = `https://www.markeet.com/product/${id}`;
    const availability = isOutOfStock ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';

    return (
      <div className="product-page-container loaded">
        <Helmet>
          <title>{`${name} - Markeet`}</title>
          <meta name="description" content={desc} />
          <link rel="canonical" href={url} />
          <meta property="og:title" content={`${name} - Markeet`} />
          <meta property="og:description" content={desc} />
          <meta property="og:image" content={images[0] || DEFAULT_IMAGE} />
          <meta property="og:url" content={url} />
          <meta property="og:type" content="product" />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name, description: desc, image: images, category: product.category_name,
              offers: {
                '@type': 'Offer',
                price: (getActiveVariant?.price || product.price) / 100,
                priceCurrency: 'INR',
                availability,
                seller: { '@type': 'Organization', name: product.sellers?.store_name || 'Markeet Seller' }
              },
              aggregateRating: reviews.length > 0 ? { '@type': 'AggregateRating', ratingValue: averageRating.toFixed(1), reviewCount: reviews.length } : null,
            })}
          </script>
        </Helmet>

        <button
          onClick={() => {
            const state = location.state || {};
            if (state.fromCategory && state.categoryId) {
              navigate(`/products?category=${state.categoryId}`, { state: { ...state, fromCategories: true } });
            } else {
              navigate(-1);
            }
          }}
          className="enhanced-back-btn"
        >
          ← Back
        </button>

        <div className="main-content">
          <div className="product-image-section">
            <div className="image-slider-container">
              {images.length > 1 ? (
                <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1} arrows className="image-slider">
                  {images.map((img, i) => (
                    <div key={i} className="slider-image-wrapper">
                      <img src={img} alt={`${name} ${i + 1}`} onClick={() => handleImageClick(i)} onError={e => e.target.src = DEFAULT_IMAGE} className="clickable-image" loading="lazy" />
                    </div>
                  ))}
                </Slider>
              ) : (
                <img src={images[0]} alt={name} onClick={() => handleImageClick(0)} onError={e => e.target.src = DEFAULT_IMAGE} className="clickable-image" loading="lazy" />
              )}
            </div>
          </div>

          <div className="product-details-section">
            <h1 className="product-title">{name}</h1>
            <div className={`price-section ${getPriceInfo?.hasDiscount ? 'offer-highlight' : ''}`}>
              {getPriceInfo?.hasDiscount && <span className="deal-label">Special Offer</span>}
              <div className="price-details">
                <span className="current-price">{getPriceInfo?.formattedFinal}</span>
                {getPriceInfo?.hasDiscount && (
                  <>
                    <span className="original-price">{getPriceInfo?.formattedOriginal}</span>
                    <span className="discount">Save {getPriceInfo?.formattedSavings}</span>
                  </>
                )}
              </div>
            </div>

            {isLowStock && <p className="low-stock-warning">Hurry! Only {getActiveVariant?.stock || product.stock} left.</p>}
            {isOutOfStock && <p className="low-stock-warning">Out of stock</p>}

            <ul className="product-highlights">
              {product.description?.split(';').filter(Boolean).map((p, i) => <li key={i}>{p.trim()}</li>) || <li>No description.</li>}
            </ul>

            {variantAttributes.length > 0 && (
              <div className="variant-section">
                <h4>Select Variant</h4>
                <div role="radiogroup" className="variant-options">
                  {variantAttributes.map(v => (
                    <button
                      key={v.id}
                      className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
                      onClick={() => setSelectedVariantIndex(v.index)}
                      disabled={variants[v.index].stock <= 0}
                    >
                      {v.attributes}
                      {variants[v.index].stock <= 5 && variants[v.index].stock > 0 && ` (Low: ${variants[v.index].stock})`}
                      {variants[v.index].stock === 0 && ' (Out)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button onClick={() => addToCart(false)} className="add-to-cart-button" disabled={isOutOfStock}>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button onClick={() => addToCart(true)} className="buy-now-button" disabled={isOutOfStock}>
                Buy Now
              </button>
            </div>

            <div className="seller-info">
              <p>Seller: {product.sellers?.store_name || 'Unknown'}</p>
              <Link to={`/seller/${product.seller_id}`} className="seller-link">View Profile</Link>
            </div>
          </div>
        </div>

        {/* Fullscreen Viewer */}
        {isFullScreenOpen && (
          <div className="full-screen-image" onClick={handleCloseFullScreen}>
            <div className="full-screen-slider-container" onClick={e => e.stopPropagation()}>
              <Slider ref={fullScreenSliderRef} dots={false} infinite speed={500} slidesToShow={1} initialSlide={fullScreenImageIndex} afterChange={setFullScreenImageIndex}>
                {images.map((img, i) => (
                  <div key={i} className="full-screen-slide">
                    <TransformWrapper initialScale={1} minScale={0.5} maxScale={4}>
                      {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                          <TransformComponent wrapperClass="transform-wrapper">
                            {imageLoadingStates[i] && <div className="image-loading-spinner"><svg className="premium-spinner" viewBox="0 0 50 50"><circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" /></svg></div>}
                            <img src={img} alt={`${name} ${i + 1}`} onError={e => e.target.src = FULLSCREEN_DEFAULT_IMAGE} onLoad={() => setImageLoadingStates(p => ({ ...p, [i]: false }))} className="full-screen-image-content" loading="eager" />
                          </TransformComponent>
                          <div className="zoom-controls">
                            <button onClick={() => zoomIn()}>+</button>
                            <button onClick={() => zoomOut()}>-</button>
                            <button onClick={() => resetTransform()}>Reset</button>
                          </div>
                        </>
                      )}
                    </TransformWrapper>
                  </div>
                ))}
              </Slider>
              {images.length > 1 && (
                <>
                  <button className="full-screen-nav-btn prev" onClick={() => fullScreenSliderRef.current?.slickPrev()}>Previous</button>
                  <button className="full-screen-nav-btn next" onClick={() => fullScreenSliderRef.current?.slickNext()}>Next</button>
                </>
              )}
            </div>
            <button className="full-screen-close-btn" onClick={handleCloseFullScreen}>×</button>
          </div>
        )}

        {/* Reviews, Specs, Related */}
        <div className="ratings-reviews-section">
          <h3>Ratings & Reviews</h3>
          <div className="rating-score"><StarRatingDisplay rating={averageRating} /> <span>({reviews.length} reviews)</span></div>
          {reviews.length > 0 ? reviews.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-header"><span>{r.reviewer_name}</span><StarRatingDisplay rating={r.rating} /></div>
              <p>{r.review_text}</p>
              {r.reply_text && <p className="review-reply">Reply: {r.reply_text}</p>}
            </div>
          )) : <p>No reviews yet.</p>}
        </div>

        <div className="specifications-section">
          <h3>Specifications</h3>
          {product.specifications && Object.keys(product.specifications).length > 0 ? (
            <div className="specifications-list">
              {Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="spec-item"><span className="spec-key">{k}</span><span className="spec-value">{v}</span></div>
              ))}
            </div>
          ) : <p>No specifications.</p>}
        </div>

        <div className="related-products-section">
          <h3>Related Products</h3>
          {isRelatedLoading ? (
            <div className="related-products-loading">
              <p>Fetching...</p>
              <div className="related-products-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="related-product-skeleton">
                    <div className="skeleton-image" />
                    <div className="skeleton-text" />
                    <div className="skeleton-text short" />
                  </div>
                ))}
              </div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="related-products-grid">
              {relatedProducts.map((item, i) => (
                <div key={item.id} className="related-product-card" onClick={() => navigate(`/product/${item.id}`)} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="related-product-image-wrapper">
                    {item.discount_amount > 0 && <span className="related-offer-badge">Save {formatCurrency(item.discount_amount)}</span>}
                    <img src={item.images[0] || DEFAULT_IMAGE} alt={item.title} onError={e => e.target.src = DEFAULT_IMAGE} className="related-product-image" loading="lazy" />
                  </div>
                  <div className="related-product-info">
                    <h4>{item.title}</h4>
                    <p className="related-product-price">{formatCurrency(item.price)}</p>
                    {item.original_price > item.price && <p className="related-product-original-price">{formatCurrency(item.original_price)}</p>}
                    <p>{item.category_name}</p>
                    {item.distance != null && <p>{item.distance.toFixed(1)} km away</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p>No related products in your area.</p>}
        </div>

        <FaCrown className="product-icon premium-icon" />
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={{ duration: TOAST_DURATION }} />
      {renderContent()}
    </ErrorBoundary>
  );
}

export default React.memo(ProductPage);