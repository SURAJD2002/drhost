
// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// // Toast Notification Library (e.g., react-toastify)
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component (Read-Only for Display)
// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);

//   // Local storage for cart & wishlist
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   // Fetch product & variants
//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch reviews from DB
//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) return [];

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .in('order_id', orderIds);
//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) return [];

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...reviewerIds, ...reviewedIds]);
//       if (profilesError) throw profilesError;

//       return reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));
//     } catch (error) {
//       return [];
//     }
//   };

//   // Calculate rating summary
//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   // Which variant is selected
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Merge product + variant images
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   // Check stock availability
//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   // react-slick settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   // Add item to cart
//   const addToCart = async () => {
//     if (!product) return;
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const { error } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: activeVariant?.id || null,
//             quantity: 1,
//           });
//         if (error) throw error;
//       } else {
//         const updatedCart = [...cart, cartItem];
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }
//       toast.success(`${product.title || product.name} added to cart!`);
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   // Add item to wishlist
//   const addToWishlist = async () => {
//     if (!product) return;
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const { error } = await supabase
//           .from('wishlist')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//           });
//         if (error) throw error;
//         toast.success(`${product.title || product.name} added to wishlist!`);
//       } else {
//         if (!wishlist.some(item => item.id === product.id)) {
//           const updatedWishlist = [...wishlist, product];
//           setWishlist(updatedWishlist);
//           localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
//           toast.success(`${product.title || product.name} added to wishlist!`);
//         } else {
//           toast.info(`${product.title || product.name} is already in your wishlist!`);
//         }
//       }
//     } catch (err) {
//       setError(`Failed to add to wishlist: ${err.message}`);
//       toast.error(`Failed to add to wishlist: ${err.message}`);
//     }
//   };

//   // Render price & discount
//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;

//     if (originalPrice && originalPrice > mainPrice) {
//       const discount = Math.round(((originalPrice - mainPrice) / originalPrice) * 100);
//       return (
//         <div className="price-section">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//           <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//           <span className="discount">{discount}% off</span>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   // Render logic
//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/products')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/products')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   // Unified variant selection with specific attributes
//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* LEFT SECTION: Images */}
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`Slide ${i}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt="Product"
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>

//           <div className="view-360">
//             <button disabled>View in 360° (Coming Soon)</button>
//           </div>
//         </div>

//         {/* RIGHT SECTION: Details */}
//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>

//           {/* Price & discount */}
//           {renderPriceSection()}

//           {/* Product highlights */}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>

//           {/* Variant Selection */}
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => setSelectedVariantIndex(v.index)}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="action-buttons">
//             <button
//               onClick={addToCart}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button className="buy-now-button" onClick={() => navigate('/checkout')}>
//               Buy Now
//             </button>
//             <button onClick={addToWishlist} className="wishlist-button">
//               Add to Wishlist
//             </button>
//           </div>

//           {/* Seller info */}
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* RATINGS & REVIEWS */}
//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>

//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       {/* SPECIFICATIONS SECTION */}
//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// // Toast Notification Library (e.g., react-toastify)
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component (Read-Only for Display)
// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);

//   // Local storage for cart
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   // Fetch product & variants
//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch reviews from DB
//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) return [];

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .in('order_id', orderIds);
//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) return [];

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...reviewerIds, ...reviewedIds]);
//       if (profilesError) throw profilesError;

//       return reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));
//     } catch (error) {
//       return [];
//     }
//   };

//   // Calculate rating summary
//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   // Which variant is selected
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Merge product + variant images
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   // Check stock availability
//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   // react-slick settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   // Add item to cart
//   const addToCart = async () => {
//     if (!product) return;
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const { error } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: activeVariant?.id || null,
//             quantity: 1,
//           });
//         if (error) throw error;
//       } else {
//         const updatedCart = [...cart, cartItem];
//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }
//       toast.success(`${product.title || product.name} added to cart!`);
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   // Render price & discount
//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;

//     if (originalPrice && originalPrice > mainPrice) {
//       const discount = Math.round(((originalPrice - mainPrice) / originalPrice) * 100);
//       return (
//         <div className="price-section">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//           <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//           <span className="discount">{discount}% off</span>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   // Render logic
//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   // Unified variant selection with specific attributes
//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* LEFT SECTION: Images */}
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT SECTION: Details */}
//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>

//           {/* Price & discount */}
//           {renderPriceSection()}

//           {/* Product highlights */}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>

//           {/* Variant Selection */}
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => setSelectedVariantIndex(v.index)}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="action-buttons">
//             <button
//               onClick={addToCart}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button className="buy-now-button" onClick={() => navigate('/checkout')}>
//               Buy Now
//             </button>
//           </div>

//           {/* Seller info */}
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* RATINGS & REVIEWS */}
//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>

//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       {/* SPECIFICATIONS SECTION */}
//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// // Toast Notification Library (react-toastify)
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component (Read-Only for Display)
// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);

//   // Local storage for cart
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   // Fetch product & variants
//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch reviews from DB
//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) return [];

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .in('order_id', orderIds);
//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) return [];

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...reviewerIds, ...reviewedIds]);
//       if (profilesError) throw profilesError;

//       return reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));
//     } catch (error) {
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   // Calculate rating summary
//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   // Which variant is selected
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Merge product + variant images
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   // Check stock availability
//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   // react-slick settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   // Add item to cart (with duplicate check based on unique_user_product constraint)
//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         // Check if the item already exists (based on user_id and product_id only, due to unique_user_product constraint)
//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           // Item exists, update quantity and variant_id if needed
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId // Update variant_id to the selected one
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           // Item doesn't exist, insert new entry
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         // Handle local cart for unauthenticated users
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   // Handle Buy Now
//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   // Render price & discount
//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;

//     if (originalPrice && originalPrice > mainPrice) {
//       const discount = Math.round(((originalPrice - mainPrice) / originalPrice) * 100);
//       return (
//         <div className="price-section">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//           <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//           <span className="discount">{discount}% off</span>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   // Render logic
//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   // Unified variant selection with specific attributes
//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* LEFT SECTION: Images */}
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT SECTION: Details */}
//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>

//           {/* Price & discount */}
//           {renderPriceSection()}

//           {/* Product highlights */}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>

//           {/* Variant Selection */}
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>

//           {/* Seller info */}
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* RATINGS & REVIEWS */}
//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>

//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       {/* SPECIFICATIONS SECTION */}
//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// // Toast Notification Library (react-toastify)
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component (Read-Only for Display)
// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);

//   // Local storage for cart
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   // Fetch product & variants
//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       // Fetch reviews after product is loaded
//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch reviews from DB
//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) return [];

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .in('order_id', orderIds);
//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) return [];

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...reviewerIds, ...reviewedIds]);
//       if (profilesError) throw profilesError;

//       return reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));
//     } catch (error) {
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   // Calculate rating summary
//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   // Which variant is selected
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Merge product + variant images
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   // Check stock availability
//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   // react-slick settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   // Add item to cart (with duplicate check based on unique_user_product constraint)
//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         // Check if the item already exists (based on user_id and product_id only, due to unique_user_product constraint)
//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           // Item exists, update quantity and variant_id if needed
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId // Update variant_id to the selected one
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           // Item doesn't exist, insert new entry
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         // Handle local cart for unauthenticated users
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   // Handle Buy Now
//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   // Render price & discount
//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;

//     if (originalPrice && originalPrice > mainPrice) {
//       const discount = Math.round(((originalPrice - mainPrice) / originalPrice) * 100);
//       return (
//         <div className="price-section">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//           <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//           <span className="discount">{discount}% off</span>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   // Render logic
//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   // Unified variant selection with specific attributes
//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* LEFT SECTION: Images */}
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT SECTION: Details */}
//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>

//           {/* Price & discount */}
//           {renderPriceSection()}

//           {/* Product highlights */}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>

//           {/* Variant Selection */}
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>

//           {/* Seller info */}
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* RATINGS & REVIEWS */}
//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>

//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       {/* SPECIFICATIONS SECTION */}
//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// // Toast Notification Library (react-toastify)
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// // Star Rating Component (Read-Only for Display)
// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);

//   // Local storage for cart
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   // Fetch product & variants
//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       // Fetch reviews after product is loaded
//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch reviews from DB
//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) return [];

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];

//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .in('order_id', orderIds);
//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) return [];

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', [...reviewerIds, ...reviewedIds]);
//       if (profilesError) throw profilesError;

//       return reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));
//     } catch (error) {
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   // Calculate rating summary
//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   // Which variant is selected
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Merge product + variant images
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   // Check stock availability
//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   // Check for low stock (less than 5 items)
//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   // react-slick settings
//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   // Add item to cart (with duplicate check based on unique_user_product constraint)
//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         // Check if the item already exists (based on user_id and product_id only, due to unique_user_product constraint)
//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           // Item exists, update quantity and variant_id if needed
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId // Update variant_id to the selected one
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           // Item doesn't exist, insert new entry
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         // Handle local cart for unauthenticated users
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   // Handle Buy Now
//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   // Render price & discount
//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     if (originalPrice && originalPrice > mainPrice && discountAmount > 0) {
//       return (
//         <div className="price-section offer-highlight">
//           <span className="deal-label">Deal of the Day</span>
//           <div className="price-details">
//             <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   // Render logic
//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   // Unified variant selection with specific attributes
//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       {/* Main Content */}
//       <div className="main-content">
//         {/* LEFT SECTION: Images */}
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT SECTION: Details */}
//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>

//           {/* Price & discount */}
//           {renderPriceSection()}

//           {/* Low stock warning */}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}

//           {/* Product highlights */}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>

//           {/* Variant Selection */}
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Action buttons */}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>

//           {/* Seller info */}
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* RATINGS & REVIEWS */}
//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>

//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
//             </div>
//           ))
//         ) : (
//           <p className="no-reviews">No reviews yet.</p>
//         )}
//       </div>

//       {/* SPECIFICATIONS SECTION */}
//       <div className="specifications-section">
//         <h3>Specifications</h3>
//         {product.specifications && Object.keys(product.specifications).length > 0 ? (
//           <div className="specifications-list">
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;

// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       // Step 1: Fetch order_ids associated with this product
//       const { data: orderItemsData, error: orderItemsError } = await supabase
//         .from('order_items')
//         .select('order_id, product_id')
//         .eq('product_id', productId);
//       if (orderItemsError) throw orderItemsError;
//       if (!orderItemsData || orderItemsData.length === 0) {
//         console.log('No order items found for product ID:', productId);
//         return [];
//       }

//       const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
//       if (!orderIds.length) {
//         console.log('No order IDs found for product ID:', productId);
//         return [];
//       }

//       // Step 2: Fetch reviews for these orders using the same approach as OrderDetails
//       let reviewsData = [];
//       for (const orderId of orderIds) {
//         try {
//           const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_reviews', {
//             order_id_param: parseInt(orderId),
//           });
//           if (rpcError) throw rpcError;
//           reviewsData = [...reviewsData, ...(rpcData || [])];
//         } catch (rpcError) {
//           console.log(`RPC get_order_reviews failed for order ${orderId}:`, rpcError.message);
//           // Fallback to direct query
//           const { data: fallbackData, error: fallbackError } = await supabase
//             .from('reviews')
//             .select(`
//               id,
//               order_id,
//               reviewer_id,
//               reviewed_id,
//               rating,
//               review_text,
//               reply_text,
//               created_at,
//               updated_at
//             `)
//             .eq('order_id', orderId)
//             .order('created_at', { ascending: false });
//           if (fallbackError) throw fallbackError;
//           const mappedFallbackData = fallbackData.map(review => ({
//             review_id: review.id,
//             order_id: review.order_id,
//             reviewer_id: review.reviewer_id,
//             reviewed_id: review.reviewed_id,
//             rating: review.rating,
//             review_text: review.review_text,
//             reply_text: review.reply_text,
//             created_at: review.created_at,
//             updated_at: review.updated_at,
//             reviewer_name: null,
//             reviewed_name: null,
//           }));
//           reviewsData = [...reviewsData, ...mappedFallbackData];
//         }
//       }

//       if (!reviewsData.length) {
//         console.log('No reviews found for order IDs:', orderIds);
//         return [];
//       }

//       // Step 3: Fetch profiles for reviewer and reviewed users
//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       // Step 4: Map profiles to reviews and sort by created_at
//       const mappedReviews = reviewsData.map(review => ({
//         ...review,
//         reviewer_name: profilesData?.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     if (originalPrice && originalPrice > mainPrice && discountAmount > 0) {
//       return (
//         <div className="price-section offer-highlight">
//           <span className="deal-label">Deal of the Day</span>
//           <div className="price-details">
//             <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       // Step 1: Fetch reviews directly by product_id
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       // Step 2: Fetch profiles for reviewer and reviewed users
//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       // Step 3: Map profiles to reviews
//       const mappedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     if (originalPrice && originalPrice > mainPrice && discountAmount > 0) {
//       return (
//         <div className="price-section offer-highlight">
//           <span className="deal-label">Deal of the Day</span>
//           <div className="price-details">
//             <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${product.title || product.name} Slide ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={product.title || product.name}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{product.title || product.name}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { Helmet } from 'react-helmet-async'; // Added

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.');
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.');
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.');
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`);
//         }
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`);
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`);
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.info('Redirecting to cart...');
//         navigate('/cart');
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`);
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     if (originalPrice && originalPrice > mainPrice && discountAmount > 0) {
//       return (
//         <div className="price-section offer-highlight">
//           <span className="deal-label">Deal of the Day</span>
//           <div className="price-details">
//             <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0 ? reviews.map(review => ({
//     "@type": "Review",
//     author: { "@type": "Person", name: review.reviewer_name },
//     reviewRating: { "@type": "Rating", ratingValue: review.rating },
//     reviewBody: review.review_text,
//     datePublished: review.created_at,
//   })) : [];

//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`} />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "Product",
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               "@type": "Offer",
//               price: productPrice,
//               priceCurrency: "INR",
//               availability: availability,
//               seller: {
//                 "@type": "Organization",
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0 ? {
//               "@type": "AggregateRating",
//               ratingValue: averageRating.toFixed(1),
//               reviewCount: totalReviewsCount,
//             } : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>

//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.info(`Selected variant: ${v.attributes}`);
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct(productData);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       const validVariants = variantData?.filter(variant => {
//         const attributes = variant.attributes || {};
//         const hasValidAttributes = Object.entries(attributes).some(([key, value]) => key !== 'attribute1' || (key === 'attribute1' && value));
//         return hasValidAttributes;
//       }) || [];
//       setVariants(validVariants);

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map(r => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map(review => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find(p => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find(p => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       ...product,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       images: activeVariant?.images && activeVariant.images.length > 0
//         ? activeVariant.images
//         : product.images,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .maybeSingle();

//         if (fetchError) {
//           throw fetchError;
//         }

//         if (existingCartItem) {
//           const newQuantity = (existingCartItem.quantity || 1) + 1;
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({ 
//               quantity: newQuantity,
//               variant_id: variantId
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) {
//             throw updateError;
//           }
//           toast.success(`${product.title || product.name} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//             });

//           if (insertError) {
//             throw insertError;
//           }
//           toast.success(`${product.title || product.name} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           item => item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex
//               ? { ...item, quantity: (item.quantity || 1) + 1 }
//               : item
//           );
//           toast.success(`${product.title || product.name} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           updatedCart = [...cart, { ...cartItem, quantity: 1 }];
//           toast.success(`${product.title || product.name} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.loading('Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const variantPrice = activeVariant?.price;
//     const mainPrice = variantPrice || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     if (originalPrice && originalPrice > mainPrice && discountAmount > 0) {
//       return (
//         <div className="price-section offer-highlight">
//           <span className="deal-label">Deal of the Day</span>
//           <div className="price-details">
//             <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
//           </div>
//         </div>
//       );
//     }
//     return (
//       <div className="price-section">
//         <span className="current-price">₹{mainPrice.toLocaleString('en-IN')}</span>
//       </div>
//     );
//   };

//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={fetchProductAndVariants} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//       </div>
//     </div>
//   );

//   if (!product) return (
//     <div className="error">
//       Product not found
//       <button onClick={() => navigate('/')} className="back-btn">Back to Products</button>
//     </div>
//   );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0 ? reviews.map(review => ({
//     "@type": "Review",
//     author: { "@type": "Person", name: review.reviewer_name },
//     reviewRating: { "@type": "Rating", ratingValue: review.rating },
//     reviewBody: review.review_text,
//     datePublished: review.created_at,
//   })) : [];

//   const variantAttributes = variants.map(v => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     color: v.attributes?.color || '',
//     model: v.attributes?.model || '',
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val)
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some(v => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`} />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "Product",
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               "@type": "Offer",
//               price: productPrice,
//               priceCurrency: "INR",
//               availability: availability,
//               seller: {
//                 "@type": "Organization",
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating: reviews.length > 0 ? {
//               "@type": "AggregateRating",
//               ratingValue: averageRating.toFixed(1),
//               reviewCount: totalReviewsCount,
//             } : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>
//       <Toaster
//         position="top-center"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '8px',
//             padding: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             fontSize: '16px',
//             transition: 'all 0.3s ease-in-out',
//           },
//           success: {
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#52c41a',
//             },
//           },
//           error: {
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#ff4d4f',
//             },
//           },
//           loading: {
//             style: {
//               background: '#1890ff',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#1890ff',
//             },
//           },
//         }}
//       />

//       <button
//         onClick={() => navigate('/')}
//         className="enhanced-back-btn"
//       >
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter(point => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map((v) => (
//                   v.attributes && (
//                     <button
//                       key={v.id}
//                       className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                       onClick={() => {
//                         setSelectedVariantIndex(v.index);
//                         toast.success(`Selected variant: ${v.attributes}`, {
//                           duration: 4000,
//                           position: 'top-center',
//                           style: {
//                             background: '#52c41a',
//                             color: '#fff',
//                             fontWeight: 'bold',
//                             borderRadius: '8px',
//                             padding: '16px',
//                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                           },
//                         });
//                       }}
//                     >
//                       {v.attributes || `Variant #${v.index + 1}`}
//                     </button>
//                   )
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//       });

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw variantError;

//       const validVariants = variantData
//         ?.filter((variant) => {
//           const attributes = variant.attributes || {};
//           const hasValidAttributes = Object.entries(attributes).some(
//             ([key, value]) => value && value.trim() && key !== 'attribute1'
//           );
//           return hasValidAttributes && variant.price !== null && variant.stock !== null;
//         })
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//           discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//           stock: variant.stock || 0,
//           images: variant.images && variant.images.length > 0 ? variant.images : productData.images,
//         })) || [];
//       setVariants(validVariants);

//       if (validVariants.length > 0 && selectedVariantIndex >= validVariants.length) {
//         setSelectedVariantIndex(0);
//       }

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map((r) => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map((review) => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find((p) => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find((p) => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0 && selectedVariantIndex < variants.length) {
//       return variants[selectedVariantIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       id: product.id,
//       title: product.title || product.name,
//       selectedVariant: activeVariant || null,
//       price: activeVariant?.price || product.price,
//       original_price: activeVariant?.original_price || product.original_price,
//       discount_amount: activeVariant?.discount_amount || product.discount_amount,
//       images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
//       stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
//       quantity: 1,
//     };

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         const { data: existingCartItem, error: fetchError } = await supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId)
//           .eq('variant_id', variantId)
//           .maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//         const stockLimit = activeVariant?.stock !== undefined ? activeVariant.stock : product.stock;
//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           const { error: updateError } = await supabase
//             .from('cart')
//             .update({
//               quantity: newQuantity,
//               variant_id: variantId,
//               price: cartItem.price,
//               title: cartItem.title,
//             })
//             .eq('id', existingCartItem.id);

//           if (updateError) throw updateError;
//           toast.success(`${cartItem.title} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (stockLimit < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           const { error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//               price: cartItem.price,
//               title: cartItem.title,
//             });

//           if (insertError) throw insertError;
//           toast.success(`${cartItem.title} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           (item) =>
//             item.id === product.id && (item.selectedVariant?.id || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           const newQuantity = cart[existingLocalItemIndex].quantity + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex ? { ...item, quantity: newQuantity } : item
//           );
//           toast.success(`${cartItem.title} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (cartItem.stock < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = [...cart, cartItem];
//           toast.success(`${cartItem.title} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.loading('Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const mainPrice = activeVariant?.price || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     return (
//       <div className={`price-section ${originalPrice && originalPrice > mainPrice ? 'offer-highlight' : ''}`}>
//         {originalPrice && originalPrice > mainPrice && discountAmount > 0 && (
//           <span className="deal-label">Deal of the Day</span>
//         )}
//         <div className="price-details">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           {originalPrice && originalPrice > mainPrice && (
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//           {discountAmount > 0 && (
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//         </div>
//         {variants.length > 1 && (
//           <p className="variant-price-info">
//             Starting at ₹{Math.min(...variants.map((v) => v.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </p>
//         )}
//       </div>
//     );
//   };

//   if (loading)
//     return (
//       <div className="loading">
//         <svg className="spinner" viewBox="0 0 50 50">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="error">
//         {error}
//         <div className="error-actions">
//           <button onClick={fetchProductAndVariants} className="retry-btn">
//             Retry
//           </button>
//           <button onClick={() => navigate('/')} className="back-btn">
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );

//   if (!product)
//     return (
//       <div className="error">
//         Product not found
//         <button onClick={() => navigate('/')} className="back-btn">
//           Back to Products
//         </button>
//       </div>
//     );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0
//     ? reviews.map((review) => ({
//         '@type': 'Review',
//         author: { '@type': 'Person', name: review.reviewer_name },
//         reviewRating: { '@type': 'Rating', ratingValue: review.rating },
//         reviewBody: review.review_text,
//         datePublished: review.created_at,
//       }))
//     : [];

//   const variantAttributes = variants.map((v) => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta
//           name="keywords"
//           content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               '@type': 'Offer',
//               price: productPrice,
//               priceCurrency: 'INR',
//               availability: availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating:
//               reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: totalReviewsCount,
//                   }
//                 : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>
//       <Toaster
//         position="top-center"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '8px',
//             padding: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             fontSize: '16px',
//             transition: 'all 0.3s ease-in-out',
//           },
//           success: {
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#52c41a',
//             },
//           },
//           error: {
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#ff4d4f',
//             },
//           },
//           loading: {
//             style: {
//               background: '#1890ff',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#1890ff',
//             },
//           },
//         }}
//       />

//       <button onClick={() => navigate('/')} className="enhanced-back-btn">
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map(
//                   (v) =>
//                     v.attributes && (
//                       <button
//                         key={v.id}
//                         className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                         onClick={() => {
//                           setSelectedVariantIndex(v.index);
//                           toast.success(`Selected variant: ${v.attributes}`, {
//                             duration: 4000,
//                             position: 'top-center',
//                             style: {
//                               background: '#52c41a',
//                               color: '#fff',
//                               fontWeight: 'bold',
//                               borderRadius: '8px',
//                               padding: '16px',
//                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                             },
//                           });
//                         }}
//                       >
//                         {v.attributes || `Variant #${v.index + 1}`}
//                       </button>
//                     )
//                 )}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//       });

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw variantError;

//       const validVariants = variantData
//         ?.filter((variant) => {
//           const attributes = variant.attributes || {};
//           const hasValidAttributes = Object.entries(attributes).some(
//             ([key, value]) => value && value.trim() && key !== 'attribute1'
//           );
//           return hasValidAttributes && variant.price !== null && variant.stock !== null;
//         })
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//           discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//           stock: variant.stock || 0,
//           images: variant.images && variant.images.length > 0 ? variant.images : productData.images,
//         })) || [];
//       setVariants(validVariants);

//       if (validVariants.length > 0 && selectedVariantIndex >= validVariants.length) {
//         setSelectedVariantIndex(0);
//       }

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map((r) => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map((review) => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find((p) => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find((p) => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0 && selectedVariantIndex < variants.length) {
//       return variants[selectedVariantIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       id: product.id,
//       cartId: null,
//       title: product.title || product.name || 'Product',
//       selectedVariant: activeVariant || null,
//       variantId: activeVariant?.id || null,
//       price: activeVariant?.price || product.price || 0,
//       original_price: activeVariant?.original_price || product.original_price || null,
//       discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//       images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
//       stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
//       quantity: 1,
//     };

//     if (cartItem.price === 0) {
//       toast.error('Invalid product price.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         // Handle null variant_id explicitly in the query
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//         const stockLimit = activeVariant?.stock !== undefined ? activeVariant.stock : product.stock;

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: upsertError } = await supabase
//             .from('cart')
//             .upsert(
//               {
//                 id: existingCartItem.id,
//                 user_id: userId,
//                 product_id: productId,
//                 variant_id: variantId,
//                 quantity: newQuantity,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               },
//               { onConflict: ['user_id', 'product_id', 'variant_id'] }
//             )
//             .select()
//             .single();

//           if (upsertError) throw upsertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (stockLimit < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: upsertError } = await supabase
//             .from('cart')
//             .upsert(
//               {
//                 user_id: userId,
//                 product_id: productId,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               },
//               { onConflict: ['user_id', 'product_id', 'variant_id'] }
//             )
//             .select()
//             .single();

//           if (upsertError) throw upsertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         // Sync local cart
//         const existingLocalItemIndex = cart.findIndex(
//           (item) =>
//             item.id === product.id && (item.variantId || null) === (activeVariant?.id || null)
//         );
//         let updatedCart;
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
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           (item) =>
//             item.id === product.id && (item.variantId || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           const newQuantity = cart[existingLocalItemIndex].quantity + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex ? { ...item, quantity: newQuantity } : item
//           );
//           toast.success(`${cartItem.title} quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (cartItem.stock < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = [...cart, cartItem];
//           toast.success(`${cartItem.title} added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.loading('Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const mainPrice = activeVariant?.price || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     return (
//       <div className={`price-section ${originalPrice && originalPrice > mainPrice ? 'offer-highlight' : ''}`}>
//         {originalPrice && originalPrice > mainPrice && discountAmount > 0 && (
//           <span className="deal-label">Deal of the Day</span>
//         )}
//         <div className="price-details">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           {originalPrice && originalPrice > mainPrice && (
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//           {discountAmount > 0 && (
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//         </div>
//         {variants.length > 1 && (
//           <p className="variant-price-info">
//             Starting at ₹{Math.min(...variants.map((v) => v.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </p>
//         )}
//       </div>
//     );
//   };

//   if (loading)
//     return (
//       <div className="loading">
//         <svg className="spinner" viewBox="0 0 50 50">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="error">
//         {error}
//         <div className="error-actions">
//           <button onClick={fetchProductAndVariants} className="retry-btn">
//             Retry
//           </button>
//           <button onClick={() => navigate('/')} className="back-btn">
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );

//   if (!product)
//     return (
//       <div className="error">
//         Product not found
//         <button onClick={() => navigate('/')} className="back-btn">
//           Back to Products
//         </button>
//       </div>
//     );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0
//     ? reviews.map((review) => ({
//         '@type': 'Review',
//         author: { '@type': 'Person', name: review.reviewer_name },
//         reviewRating: { '@type': 'Rating', ratingValue: review.rating },
//         reviewBody: review.review_text,
//         datePublished: review.created_at,
//       }))
//     : [];

//   const variantAttributes = variants.map((v) => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta
//           name="keywords"
//           content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               '@type': 'Offer',
//               price: productPrice,
//               priceCurrency: 'INR',
//               availability: availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating:
//               reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: totalReviewsCount,
//                   }
//                 : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>
//       <Toaster
//         position="top-center"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '8px',
//             padding: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             fontSize: '16px',
//             transition: 'all 0.3s ease-in-out',
//           },
//           success: {
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#52c41a',
//             },
//           },
//           error: {
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#ff4d4f',
//             },
//           },
//           loading: {
//             style: {
//               background: '#1890ff',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#1890ff',
//             },
//           },
//         }}
//       />

//       <button onClick={() => navigate('/')} className="enhanced-back-btn">
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Variants:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map(
//                   (v) =>
//                     v.attributes && (
//                       <button
//                         key={v.id}
//                         className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                         onClick={() => {
//                           setSelectedVariantIndex(v.index);
//                           toast.success(`Selected variant: ${v.attributes}`, {
//                             duration: 4000,
//                             position: 'top-center',
//                             style: {
//                               background: '#52c41a',
//                               color: '#fff',
//                               fontWeight: 'bold',
//                               borderRadius: '8px',
//                               padding: '16px',
//                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                             },
//                           });
//                         }}
//                       >
//                         {v.attributes || `Variant #${v.index + 1}`}
//                       </button>
//                     )
//                 )}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//       });

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw variantError;

//       const validVariants = variantData
//         ?.filter((variant) => {
//           const attributes = variant.attributes || {};
//           const hasValidAttributes = Object.entries(attributes).some(
//             ([key, value]) => value && value.trim() && key !== 'attribute1'
//           );
//           return hasValidAttributes && variant.price !== null && variant.stock !== null;
//         })
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//           discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//           stock: variant.stock || 0,
//           images: variant.images && variant.images.length > 0 ? variant.images : productData.images,
//         })) || [];
//       setVariants(validVariants);

//       if (validVariants.length > 0 && selectedVariantIndex >= validVariants.length) {
//         setSelectedVariantIndex(0);
//       }

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchProductReviews = async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.log('No reviews found for product ID:', productId);
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map((r) => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map((review) => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find((p) => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find((p) => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return [];
//     }
//   };

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0 && selectedVariantIndex < variants.length) {
//       return variants[selectedVariantIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       id: product.id,
//       cartId: null,
//       title: product.title || product.name || 'Product',
//       selectedVariant: activeVariant || null,
//       variantId: activeVariant?.id || null,
//       price: activeVariant?.price || product.price || 0,
//       original_price: activeVariant?.original_price || product.original_price || null,
//       discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//       images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
//       stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
//       quantity: 1,
//     };

//     if (cartItem.price === 0) {
//       toast.error('Invalid product price.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         // Check if the same product with the same variant exists in the cart
//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//         const stockLimit = activeVariant?.stock !== undefined ? activeVariant.stock : product.stock;

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: upsertError } = await supabase
//             .from('cart')
//             .upsert(
//               {
//                 id: existingCartItem.id,
//                 user_id: userId,
//                 product_id: productId,
//                 variant_id: variantId,
//                 quantity: newQuantity,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               },
//               { onConflict: ['user_id', 'product_id', 'variant_id'] }
//             )
//             .select()
//             .single();

//           if (upsertError) throw upsertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (stockLimit < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: upsertError } = await supabase
//             .from('cart')
//             .upsert(
//               {
//                 user_id: userId,
//                 product_id: productId,
//                 variant_id: variantId,
//                 quantity: 1,
//                 price: cartItem.price,
//                 title: cartItem.title,
//               },
//               { onConflict: ['user_id', 'product_id', 'variant_id'] }
//             )
//             .select()
//             .single();

//           if (upsertError) throw upsertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         // Sync local cart
//         const existingLocalItemIndex = cart.findIndex(
//           (item) =>
//             item.id === product.id && (item.variantId || null) === (activeVariant?.id || null)
//         );
//         let updatedCart;
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
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           (item) =>
//             item.id === product.id && (item.variantId || null) === (activeVariant?.id || null)
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           const newQuantity = cart[existingLocalItemIndex].quantity + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex ? { ...item, quantity: newQuantity } : item
//           );
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (cartItem.stock < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = [...cart, cartItem];
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.loading('Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message}`);
//       toast.error(`Failed to add to cart: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const mainPrice = activeVariant?.price || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     return (
//       <div className={`price-section ${originalPrice && originalPrice > mainPrice ? 'offer-highlight' : ''}`}>
//         {originalPrice && originalPrice > mainPrice && discountAmount > 0 && (
//           <span className="deal-label">Deal of the Day</span>
//         )}
//         <div className="price-details">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           {originalPrice && originalPrice > mainPrice && (
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//           {discountAmount > 0 && (
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//         </div>
//         {variants.length > 1 && (
//           <p className="variant-price-info">
//             Starting at ₹{Math.min(...variants.map((v) => v.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </p>
//         )}
//       </div>
//     );
//   };

//   if (loading)
//     return (
//       <div className="loading">
//         <svg className="spinner" viewBox="0 0 50 50">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="error">
//         {error}
//         <div className="error-actions">
//           <button onClick={fetchProductAndVariants} className="retry-btn">
//             Retry
//           </button>
//           <button onClick={() => navigate('/')} className="back-btn">
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );

//   if (!product)
//     return (
//       <div className="error">
//         Product not found
//         <button onClick={() => navigate('/')} className="back-btn">
//           Back to Products
//         </button>
//       </div>
//     );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0
//     ? reviews.map((review) => ({
//         '@type': 'Review',
//         author: { '@type': 'Person', name: review.reviewer_name },
//         reviewRating: { '@type': 'Rating', ratingValue: review.rating },
//         reviewBody: review.review_text,
//         datePublished: review.created_at,
//       }))
//     : [];

//   const variantAttributes = variants.map((v) => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta
//           name="keywords"
//           content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               '@type': 'Offer',
//               price: productPrice,
//               priceCurrency: 'INR',
//               availability: availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating:
//               reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: totalReviewsCount,
//                   }
//                 : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>
//       <Toaster
//         position="top-center"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '8px',
//             padding: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             fontSize: '16px',
//             transition: 'all 0.3s ease-in-out',
//           },
//           success: {
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#52c41a',
//             },
//           },
//           error: {
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#ff4d4f',
//             },
//           },
//           loading: {
//             style: {
//               background: '#1890ff',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#1890ff',
//             },
//           },
//         }}
//       />

//       <button onClick={() => navigate('/')} className="enhanced-back-btn">
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Select Variant:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map(
//                   (v) =>
//                     v.attributes && (
//                       <button
//                         key={v.id}
//                         className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                         onClick={() => {
//                           setSelectedVariantIndex(v.index);
//                           toast.success(`Selected variant: ${v.attributes}`, {
//                             duration: 4000,
//                             position: 'top-center',
//                             style: {
//                               background: '#52c41a',
//                               color: '#fff',
//                               fontWeight: 'bold',
//                               borderRadius: '8px',
//                               padding: '16px',
//                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                             },
//                           });
//                         }}
//                       >
//                         {v.attributes || `Variant #${v.index + 1}`}
//                       </button>
//                     )
//                 )}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import '../style/ProductPage.css';
import { Helmet } from 'react-helmet-async';

const StarRatingDisplay = ({ rating }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="star-rating-display">
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);

  useEffect(() => {
    setReviews([]);
    fetchProductAndVariants();
  }, [id]);

  const fetchProductAndVariants = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, sellers(latitude, longitude, store_name)')
        .eq('id', parseInt(id, 10))
        .eq('is_approved', true)
        .eq('status', 'active')
        .maybeSingle();
      if (productError) throw productError;
      if (!productData) {
        setError('Product not found.');
        setLoading(false);
        return;
      }
      setProduct({
        ...productData,
        price: parseFloat(productData.price) || 0,
        original_price: productData.original_price ? parseFloat(productData.original_price) : null,
        discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
      });

      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
        .eq('product_id', parseInt(id, 10))
        .eq('status', 'active');
      if (variantError) throw variantError;

      const validVariants = variantData
        ?.filter((variant) => {
          const attributes = variant.attributes || {};
          const hasValidAttributes = Object.entries(attributes).some(
            ([key, value]) => value && value.trim() && key !== 'attribute1'
          );
          return hasValidAttributes && variant.price !== null && variant.stock !== null;
        })
        .map((variant) => ({
          ...variant,
          price: parseFloat(variant.price) || 0,
          original_price: variant.original_price ? parseFloat(variant.original_price) : null,
          discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
          stock: variant.stock || 0,
          images: variant.images && variant.images.length > 0 ? variant.images : productData.images,
        })) || [];
      setVariants(validVariants);

      if (validVariants.length > 0 && selectedVariantIndex >= validVariants.length) {
        setSelectedVariantIndex(0);
      }

      const productReviews = await fetchProductReviews(parseInt(id, 10));
      setReviews(productReviews);
    } catch (err) {
      setError(`Error: ${err.message || 'Failed to load product.'}`);
      toast.error(`Failed to load product: ${err.message}`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async (productId) => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          order_id,
          reviewer_id,
          reviewed_id,
          rating,
          review_text,
          reply_text,
          created_at,
          updated_at
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) {
        console.log('No reviews found for product ID:', productId);
        return [];
      }

      const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
      const reviewedIds = [...new Set(reviewsData.map((r) => r.reviewed_id))];
      const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allProfileIds);
      if (profilesError) throw profilesError;

      const mappedReviews = reviewsData.map((review) => ({
        review_id: review.id,
        order_id: review.order_id,
        reviewer_id: review.reviewer_id,
        reviewed_id: review.reviewed_id,
        rating: review.rating,
        review_text: review.review_text,
        reply_text: review.reply_text,
        created_at: review.created_at,
        updated_at: review.updated_at,
        reviewer_name: profilesData?.find((p) => p.id === review.reviewer_id)?.name || 'Unknown User',
        reviewed_name: profilesData?.find((p) => p.id === review.reviewed_id)?.name || 'Unknown User',
      }));

      return mappedReviews;
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      toast.error('Failed to load reviews.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
      return [];
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;
  const totalReviewsCount = reviews.length;

  const getActiveVariant = () => {
    if (variants.length > 0 && selectedVariantIndex < variants.length) {
      return variants[selectedVariantIndex];
    }
    return null;
  };

  const getDisplayedImages = () => {
    const activeVariant = getActiveVariant();
    const productImages = product?.images || [];
    const variantImages = activeVariant?.images || [];
    const mergedImages = [...new Set([...productImages, ...variantImages])];
    return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
  };

  const isOutOfStock = () => {
    const activeVariant = getActiveVariant();
    const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
    return stock === 0 || stock === undefined;
  };

  const isLowStock = () => {
    const activeVariant = getActiveVariant();
    const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
    return stock > 0 && stock < 5;
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: false,
  };

  const addToCart = async (redirectToCart = false) => {
    if (!product) {
      toast.error('Product not available.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
      return;
    }
    if (isOutOfStock()) {
      toast.error('This item is out of stock.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
      return;
    }

    const activeVariant = getActiveVariant();
    const cartItem = {
      id: product.id,
      cartId: null,
      title: product.title || product.name || 'Product',
      selectedVariant: activeVariant ? { ...activeVariant, attributes: activeVariant.attributes || {} } : null,
      variantId: activeVariant?.id || null,
      price: activeVariant?.price || product.price || 0,
      original_price: activeVariant?.original_price || product.original_price || null,
      discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
      images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
      stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
      quantity: 1,
      uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}` // Unique identifier for cart item
    };

    if (cartItem.price === 0) {
      toast.error('Invalid product price.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userId = session.user.id;
        const productId = product.id;
        const variantId = activeVariant?.id || null;

        // Check if the same product with the same variant exists in the cart
        let query = supabase
          .from('cart')
          .select('id, quantity, variant_id')
          .eq('user_id', userId)
          .eq('product_id', productId);

        if (variantId === null) {
          query = query.is('variant_id', null);
        } else {
          query = query.eq('variant_id', variantId);
        }

        const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const stockLimit = activeVariant?.stock !== undefined ? activeVariant.stock : product.stock;

        if (existingCartItem) {
          const newQuantity = existingCartItem.quantity + 1;
          if (newQuantity > stockLimit) {
            toast.error('Exceeds available stock.', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            });
            return;
          }

          const { data, error: upsertError } = await supabase
            .from('cart')
            .update({
              quantity: newQuantity,
            })
            .eq('id', existingCartItem.id)
            .select()
            .single();

          if (upsertError) throw upsertError;

          cartItem.cartId = data.id;
          toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          });
        } else {
          if (stockLimit < 1) {
            toast.error('Item out of stock.', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            });
            return;
          }

          const { data, error: insertError } = await supabase
            .from('cart')
            .insert({
              user_id: userId,
              product_id: productId,
              variant_id: variantId,
              quantity: 1,
              price: cartItem.price,
              title: cartItem.title,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          cartItem.cartId = data.id;
          toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          });
        }

        // Sync local cart
        const existingLocalItemIndex = cart.findIndex(
          (item) => item.uniqueKey === cartItem.uniqueKey
        );
        let updatedCart;
        if (existingLocalItemIndex !== -1) {
          updatedCart = cart.map((item, index) =>
            index === existingLocalItemIndex
              ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
              : item
          );
        } else {
          updatedCart = [...cart, cartItem];
        }
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } else {
        const existingLocalItemIndex = cart.findIndex(
          (item) => item.uniqueKey === cartItem.uniqueKey
        );

        let updatedCart;
        if (existingLocalItemIndex !== -1) {
          const newQuantity = cart[existingLocalItemIndex].quantity + 1;
          if (newQuantity > cartItem.stock) {
            toast.error('Exceeds available stock.', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            });
            return;
          }
          updatedCart = cart.map((item, index) =>
            index === existingLocalItemIndex ? { ...item, quantity: newQuantity } : item
          );
          toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          });
        } else {
          if (cartItem.stock < 1) {
            toast.error('Item out of stock.', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            });
            return;
          }
          updatedCart = [...cart, cartItem];
          toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#52c41a',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
          });
        }

        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }

      if (redirectToCart) {
        toast.loading('Redirecting to cart...', {
          duration: 2000,
          position: 'top-center',
          style: {
            background: '#1890ff',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          },
        });
        setTimeout(() => navigate('/cart'), 2000);
      }
    } catch (err) {
      setError(`Failed to add to cart: ${err.message || 'Unknown error'}`);
      toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        },
      });
    }
  };

  const handleBuyNow = async () => {
    await addToCart(true);
  };

  const renderPriceSection = () => {
    const activeVariant = getActiveVariant();
    const mainPrice = activeVariant?.price || product?.price || 0;
    const originalPrice = activeVariant?.original_price || product?.original_price || null;
    const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

    return (
      <div className={`price-section ${originalPrice && originalPrice > mainPrice ? 'offer-highlight' : ''}`}>
        {originalPrice && originalPrice > mainPrice && discountAmount > 0 && (
          <span className="deal-label">Deal of the Day</span>
        )}
        <div className="price-details">
          <span className="current-price">₹{mainPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {originalPrice && originalPrice > mainPrice && (
            <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          )}
          {discountAmount > 0 && (
            <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          )}
        </div>
        {variants.length > 1 && (
          <p className="variant-price-info">
            Starting at ₹{Math.min(...variants.map((v) => v.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="loading">
        <svg className="spinner" viewBox="0 0 50 50">
          <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
        </svg>
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="error">
        {error}
        <div className="error-actions">
          <button onClick={fetchProductAndVariants} className="retry-btn">
            Retry
          </button>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Products
          </button>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="error">
        Product not found
        <button onClick={() => navigate('/')} className="back-btn">
          Back to Products
        </button>
      </div>
    );

  const displayedImages = getDisplayedImages();
  const activeVariant = getActiveVariant();
  const productName = product.title || product.name || 'Product';
  const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
  const productPrice = activeVariant?.price || product.price || 0;
  const productImage = displayedImages[0] || 'https://dummyimage.com/300';
  const productUrl = `https://www.markeet.com/product/${id}`;
  const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
  const reviewData = reviews.length > 0
    ? reviews.map((review) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: review.reviewer_name },
        reviewRating: { '@type': 'Rating', ratingValue: review.rating },
        reviewBody: review.review_text,
        datePublished: review.created_at,
      }))
    : [];

  const variantAttributes = variants.map((v) => ({
    id: v.id,
    index: variants.indexOf(v),
    attributes: Object.entries(v.attributes || {})
      .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
      .map(([key, val]) => `${key}: ${val}`)
      .join(', '),
  }));

  const hasValidVariants = variantAttributes.some((v) => v.attributes);

  return (
    <div className="product-page-container">
      <Helmet>
        <title>{productName} - Markeet</title>
        <meta name="description" content={productDescription} />
        <meta
          name="keywords"
          content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={productUrl} />
        <meta property="og:title" content={`${productName} - Markeet`} />
        <meta property="og:description" content={productDescription} />
        <meta property="og:image" content={productImage} />
        <meta property="og:url" content={productUrl} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${productName} - Markeet`} />
        <meta name="twitter:description" content={productDescription} />
        <meta name="twitter:image" content={productImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productName,
            description: productDescription,
            image: displayedImages,
            offers: {
              '@type': 'Offer',
              price: productPrice,
              priceCurrency: 'INR',
              availability: availability,
              seller: {
                '@type': 'Organization',
                name: product.sellers?.store_name || 'Markeet Seller',
              },
            },
            aggregateRating:
              reviews.length > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: averageRating.toFixed(1),
                    reviewCount: totalReviewsCount,
                  }
                : null,
            review: reviewData,
          })}
        </script>
      </Helmet>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            padding: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontSize: '16px',
            transition: 'all 0.3s ease-in-out',
          },
          success: {
            style: {
              background: '#52c41a',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#52c41a',
            },
          },
          error: {
            style: {
              background: '#ff4d4f',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ff4d4f',
            },
          },
          loading: {
            style: {
              background: '#1890ff',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#1890ff',
            },
          },
        }}
      />

      <button onClick={() => navigate('/')} className="enhanced-back-btn">
        ← Back to Products
      </button>

      <div className="main-content">
        <div className="product-image-section">
          <div className="image-slider-container">
            {displayedImages.length > 1 ? (
              <Slider {...sliderSettings}>
                {displayedImages.map((imgUrl, i) => (
                  <div key={i} className="slider-image-wrapper">
                    <img
                      src={imgUrl}
                      alt={`${productName} Image ${i + 1}`}
                      onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="single-image-wrapper">
                <img
                  src={displayedImages[0]}
                  alt={`${productName}`}
                  onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="product-details-section">
          <h1 className="product-title">{productName}</h1>
          {renderPriceSection()}
          {isLowStock() && (
            <p className="low-stock-warning">
              Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
            </p>
          )}
          <ul className="product-highlights">
            {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
              <li key={idx}>{point.trim()}</li>
            )) || <li>No description available</li>}
          </ul>
          {hasValidVariants && (
            <div className="variant-section">
              <h4>Select Variant:</h4>
              <div className="variant-options">
                {variantAttributes.map(
                  (v) =>
                    v.attributes && (
                      <button
                        key={v.id}
                        className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedVariantIndex(v.index);
                          toast.success(`Selected variant: ${v.attributes}`, {
                            duration: 4000,
                            position: 'top-center',
                            style: {
                              background: '#52c41a',
                              color: '#fff',
                              fontWeight: 'bold',
                              borderRadius: '8px',
                              padding: '16px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            },
                          });
                        }}
                      >
                        {v.attributes || `Variant #${v.index + 1}`}
                      </button>
                    )
                )}
              </div>
            </div>
          )}
          <div className="action-buttons">
            <button
              onClick={() => addToCart(false)}
              className="add-to-cart-button"
              disabled={isOutOfStock()}
            >
              {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className="buy-now-button"
              onClick={handleBuyNow}
              disabled={isOutOfStock()}
            >
              Buy Now
            </button>
          </div>
          <div className="seller-info">
            <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
            <Link to={`/seller/${product.seller_id}`} className="seller-link">
              View Seller Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="ratings-reviews-section">
        <h3>Ratings & Reviews</h3>
        <p className="by-verified">By verified customers</p>
        <div className="rating-score">
          <StarRatingDisplay rating={averageRating} />
          <span className="rating-count">
            ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <strong className="review-author">{review.reviewer_name}</strong>
                <StarRatingDisplay rating={review.rating} />
              </div>
              <p className="review-text">{review.review_text}</p>
              {review.reply_text && (
                <div className="review-reply">
                  <strong>Seller Reply:</strong> {review.reply_text}
                </div>
              )}
              <small className="review-date">
                {new Date(review.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </small>
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet.</p>
        )}
      </div>

      <div className="specifications-section">
        <h3>Specifications</h3>
        {product.specifications && Object.keys(product.specifications).length > 0 ? (
          <div className="specifications-list">
            {Object.entries(product.specifications).map(([key, value], idx) => (
              <div key={idx} className="spec-item">
                <span className="spec-key">{key}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-specs">No specifications available.</p>
        )}
      </div>
    </div>
  );
}

export default ProductPage;



///////////////////////recommended setup



// import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { supabase } from '../supabaseClient';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/ProductPage.css';
// import { Helmet } from 'react-helmet-async';

// const StarRatingDisplay = ({ rating }) => {
//   const stars = [1, 2, 3, 4, 5];
//   return (
//     <div className="star-rating-display">
//       {stars.map((star) => (
//         <span
//           key={star}
//           className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
//         >
//           ★
//         </span>
//       ))}
//     </div>
//   );
// };

// function ProductPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const hasLoggedRef = useRef(false); // Added to prevent double calls

//   const fetchProductReviews = useCallback(async (productId) => {
//     try {
//       const { data: reviewsData, error: reviewsError } = await supabase
//         .from('reviews')
//         .select(`
//           id,
//           order_id,
//           reviewer_id,
//           reviewed_id,
//           rating,
//           review_text,
//           reply_text,
//           created_at,
//           updated_at
//         `)
//         .eq('product_id', productId)
//         .order('created_at', { ascending: false });

//       if (reviewsError) throw reviewsError;
//       if (!reviewsData || reviewsData.length === 0) {
//         console.debug('No reviews found for product ID:', productId); // Changed to debug
//         return [];
//       }

//       const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
//       const reviewedIds = [...new Set(reviewsData.map((r) => r.reviewed_id))];
//       const allProfileIds = [...new Set([...reviewerIds, ...reviewedIds])];
//       const { data: profilesData, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, name')
//         .in('id', allProfileIds);
//       if (profilesError) throw profilesError;

//       const mappedReviews = reviewsData.map((review) => ({
//         review_id: review.id,
//         order_id: review.order_id,
//         reviewer_id: review.reviewer_id,
//         reviewed_id: review.reviewed_id,
//         rating: review.rating,
//         review_text: review.review_text,
//         reply_text: review.reply_text,
//         created_at: review.created_at,
//         updated_at: review.updated_at,
//         reviewer_name: profilesData?.find((p) => p.id === review.reviewer_id)?.name || 'Unknown User',
//         reviewed_name: profilesData?.find((p) => p.id === review.reviewed_id)?.name || 'Unknown User',
//       }));

//       return mappedReviews;
//     } catch (error) {
//       console.error('Error fetching product reviews:', error);
//       toast.error('Failed to load reviews.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return [];
//     }
//   }, []);

//   const fetchProductAndVariants = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*, sellers(latitude, longitude, store_name)')
//         .eq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .maybeSingle();
//       if (productError) throw productError;
//       if (!productData) {
//         setError('Product not found.');
//         setLoading(false);
//         return;
//       }
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//       });

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
//         .eq('product_id', parseInt(id, 10))
//         .eq('status', 'active');
//       if (variantError) throw variantError;

//       const validVariants = variantData
//         ?.filter((variant) => {
//           const attributes = variant.attributes || {};
//           const hasValidAttributes = Object.entries(attributes).some(
//             ([key, value]) => value && value.trim() && key !== 'attribute1'
//           );
//           return hasValidAttributes && variant.price !== null && variant.stock !== null;
//         })
//         .map((variant) => ({
//           ...variant,
//           price: parseFloat(variant.price) || 0,
//           original_price: variant.original_price ? parseFloat(variant.original_price) : null,
//           discount_amount: variant.discount_amount ? parseFloat(variant.discount_amount) : 0,
//           stock: variant.stock || 0,
//           images: variant.images && variant.images.length > 0 ? variant.images : productData.images,
//         })) || [];
//       setVariants(validVariants);

//       const productReviews = await fetchProductReviews(parseInt(id, 10));
//       setReviews(productReviews);
//     } catch (err) {
//       setError(`Error: ${err.message || 'Failed to load product.'}`);
//       toast.error(`Failed to load product: ${err.message}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [id, fetchProductReviews]);

//   useEffect(() => {
//     if (variants.length > 0 && selectedVariantIndex >= variants.length) {
//       setSelectedVariantIndex(0);
//     }
//   }, [variants, selectedVariantIndex]);

//   const logProductView = useCallback(async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user?.id || !id) return;

//       if (hasLoggedRef.current) return;
//       hasLoggedRef.current = true;

//       const response = await fetch(`${process.env.REACT_APP_API_URL}/log_interaction/${session.user.id}/${id}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ interaction_type: 'view' }),
//       });
//       if (!response.ok) {
//         throw new Error('Failed to log product view');
//       }
//     } catch (err) {
//       console.error('Error logging product view:', err);
//     }
//   }, [id]);

//   useEffect(() => {
//     hasLoggedRef.current = false; // Reset on id change
//     setReviews([]);
//     fetchProductAndVariants();
//     logProductView();
//   }, [id, logProductView, fetchProductAndVariants]);

//   const averageRating = reviews.length > 0
//     ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
//     : 0;
//   const totalReviewsCount = reviews.length;

//   const getActiveVariant = () => {
//     if (variants.length > 0 && selectedVariantIndex < variants.length) {
//       return variants[selectedVariantIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     const productImages = product?.images || [];
//     const variantImages = activeVariant?.images || [];
//     const mergedImages = [...new Set([...productImages, ...variantImages])];
//     return mergedImages.length > 0 ? mergedImages : ['https://dummyimage.com/300'];
//   };

//   const isOutOfStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock === 0 || stock === undefined;
//   };

//   const isLowStock = () => {
//     const activeVariant = getActiveVariant();
//     const stock = activeVariant?.stock !== undefined ? activeVariant.stock : product?.stock;
//     return stock > 0 && stock < 5;
//   };

//   const sliderSettings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: true,
//     autoplay: false,
//   };

//   const addToCart = async (redirectToCart = false) => {
//     if (!product) {
//       toast.error('Product not available.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }
//     if (isOutOfStock()) {
//       toast.error('This item is out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     const activeVariant = getActiveVariant();
//     const cartItem = {
//       id: product.id,
//       cartId: null,
//       title: product.title || product.name || 'Product',
//       selectedVariant: activeVariant ? { ...activeVariant, attributes: activeVariant.attributes || {} } : null,
//       variantId: activeVariant?.id || null,
//       price: activeVariant?.price || product.price || 0,
//       original_price: activeVariant?.original_price || product.original_price || null,
//       discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//       images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
//       stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
//       quantity: 1,
//       uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}`
//     };

//     if (cartItem.price === 0) {
//       toast.error('Invalid product price.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//       return;
//     }

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session) {
//         const userId = session.user.id;
//         const productId = product.id;
//         const variantId = activeVariant?.id || null;

//         let query = supabase
//           .from('cart')
//           .select('id, quantity, variant_id')
//           .eq('user_id', userId)
//           .eq('product_id', productId);

//         if (variantId === null) {
//           query = query.is('variant_id', null);
//         } else {
//           query = query.eq('variant_id', variantId);
//         }

//         const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//         if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//         const stockLimit = activeVariant?.stock !== undefined ? activeVariant.stock : product.stock;

//         if (existingCartItem) {
//           const newQuantity = existingCartItem.quantity + 1;
//           if (newQuantity > stockLimit) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: upsertError } = await supabase
//             .from('cart')
//             .update({
//               quantity: newQuantity,
//             })
//             .eq('id', existingCartItem.id)
//             .select()
//             .single();

//           if (upsertError) throw upsertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (stockLimit < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }

//           const { data, error: insertError } = await supabase
//             .from('cart')
//             .insert({
//               user_id: userId,
//               product_id: productId,
//               variant_id: variantId,
//               quantity: 1,
//               price: cartItem.price,
//               title: cartItem.title,
//             })
//             .select()
//             .single();

//           if (insertError) throw insertError;

//           cartItem.cartId = data.id;
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey
//         );
//         let updatedCart;
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
//         localStorage.setItem('cart', JSON.stringify(updatedCart));

//         await fetch(`${process.env.REACT_APP_API_URL}/log_interaction/${userId}/${productId}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ interaction_type: 'cart' }),
//         });
//       } else {
//         const existingLocalItemIndex = cart.findIndex(
//           (item) => item.uniqueKey === cartItem.uniqueKey
//         );

//         let updatedCart;
//         if (existingLocalItemIndex !== -1) {
//           const newQuantity = cart[existingLocalItemIndex].quantity + 1;
//           if (newQuantity > cartItem.stock) {
//             toast.error('Exceeds available stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = cart.map((item, index) =>
//             index === existingLocalItemIndex ? { ...item, quantity: newQuantity } : item
//           );
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) quantity updated in cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         } else {
//           if (cartItem.stock < 1) {
//             toast.error('Item out of stock.', {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//               },
//             });
//             return;
//           }
//           updatedCart = [...cart, cartItem];
//           toast.success(`${cartItem.title} (${activeVariant?.attributes ? Object.values(activeVariant.attributes).join(', ') : 'No Variant'}) added to cart!`, {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//         }

//         setCart(updatedCart);
//         localStorage.setItem('cart', JSON.stringify(updatedCart));
//       }

//       if (redirectToCart) {
//         toast.loading('Redirecting to cart...', {
//           duration: 2000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         setTimeout(() => navigate('/cart'), 2000);
//       }
//     } catch (err) {
//       setError(`Failed to add to cart: ${err.message || 'Unknown error'}`);
//       toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async () => {
//     await addToCart(true);
//   };

//   const renderPriceSection = () => {
//     const activeVariant = getActiveVariant();
//     const mainPrice = activeVariant?.price || product?.price || 0;
//     const originalPrice = activeVariant?.original_price || product?.original_price || null;
//     const discountAmount = activeVariant?.discount_amount || product?.discount_amount || 0;

//     return (
//       <div className={`price-section ${originalPrice && originalPrice > mainPrice ? 'offer-highlight' : ''}`}>
//         {originalPrice && originalPrice > mainPrice && discountAmount > 0 && (
//           <span className="deal-label">Deal of the Day</span>
//         )}
//         <div className="price-details">
//           <span className="current-price">₹{mainPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           {originalPrice && originalPrice > mainPrice && (
//             <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//           {discountAmount > 0 && (
//             <span className="discount">Save ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//           )}
//         </div>
//         {variants.length > 1 && (
//           <p className="variant-price-info">
//             Starting at ₹{Math.min(...variants.map((v) => v.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </p>
//         )}
//       </div>
//     );
//   };

//   if (loading)
//     return (
//       <div className="loading">
//         <svg className="spinner" viewBox="0 0 50 50">
//           <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="error">
//         {error}
//         <div className="error-actions">
//           <button onClick={fetchProductAndVariants} className="retry-btn">
//             Retry
//           </button>
//           <button onClick={() => navigate('/')} className="back-btn">
//             Back to Products
//           </button>
//         </div>
//       </div>
//     );

//   if (!product)
//     return (
//       <div className="error">
//         Product not found
//         <button onClick={() => navigate('/')} className="back-btn">
//           Back to Products
//         </button>
//       </div>
//     );

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = activeVariant?.price || product.price || 0;
//   const productImage = displayedImages[0] || 'https://dummyimage.com/300';
//   const productUrl = `https://www.markeet.com/product/${id}`;
//   const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
//   const reviewData = reviews.length > 0
//     ? reviews.map((review) => ({
//         '@type': 'Review',
//         author: { '@type': 'Person', name: review.reviewer_name },
//         reviewRating: { '@type': 'Rating', ratingValue: review.rating },
//         reviewBody: review.review_text,
//         datePublished: review.created_at,
//       }))
//     : [];

//   const variantAttributes = variants.map((v) => ({
//     id: v.id,
//     index: variants.indexOf(v),
//     attributes: Object.entries(v.attributes || {})
//       .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
//       .map(([key, val]) => `${key}: ${val}`)
//       .join(', '),
//   }));

//   const hasValidVariants = variantAttributes.some((v) => v.attributes);

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta
//           name="keywords"
//           content={`${productName}, ${product.category_id ? 'electronics, appliances, fashion, jewellery, gift, home decoration' : 'ecommerce'}, Markeet, buy online`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={productUrl} />
//         <meta property="og:title" content={`${productName} - Markeet`} />
//         <meta property="og:description" content={productDescription} />
//         <meta property="og:image" content={productImage} />
//         <meta property="og:url" content={productUrl} />
//         <meta property="og:type" content="product" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={`${productName} - Markeet`} />
//         <meta name="twitter:description" content={productDescription} />
//         <meta name="twitter:image" content={productImage} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'Product',
//             name: productName,
//             description: productDescription,
//             image: displayedImages,
//             offers: {
//               '@type': 'Offer',
//               price: productPrice,
//               priceCurrency: 'INR',
//               availability: availability,
//               seller: {
//                 '@type': 'Organization',
//                 name: product.sellers?.store_name || 'Markeet Seller',
//               },
//             },
//             aggregateRating:
//               reviews.length > 0
//                 ? {
//                     '@type': 'AggregateRating',
//                     ratingValue: averageRating.toFixed(1),
//                     reviewCount: totalReviewsCount,
//                   }
//                 : null,
//             review: reviewData,
//           })}
//         </script>
//       </Helmet>
//       <Toaster
//         position="top-center"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '8px',
//             padding: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             fontSize: '16px',
//             transition: 'all 0.3s ease-in-out',
//           },
//           success: {
//             style: {
//               background: '#52c41a',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#52c41a',
//             },
//           },
//           error: {
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#ff4d4f',
//             },
//           },
//           loading: {
//             style: {
//               background: '#1890ff',
//               color: '#fff',
//             },
//             iconTheme: {
//               primary: '#fff',
//               secondary: '#1890ff',
//             },
//           },
//         }}
//       />

//       <button onClick={() => navigate('/')} className="enhanced-back-btn">
//         ← Back to Products
//       </button>

//       <div className="main-content">
//         <div className="product-image-section">
//           <div className="image-slider-container">
//             {displayedImages.length > 1 ? (
//               <Slider {...sliderSettings}>
//                 {displayedImages.map((imgUrl, i) => (
//                   <div key={i} className="slider-image-wrapper">
//                     <img
//                       src={imgUrl}
//                       alt={`${productName} ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName}`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="product-details-section">
//           <h1 className="product-title">{productName}</h1>
//           {renderPriceSection()}
//           {isLowStock() && (
//             <p className="low-stock-warning">
//               Hurry! Only {activeVariant?.stock || product?.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx}>{point.trim()}</li>
//             )) || <li>No description available</li>}
//           </ul>
//           {hasValidVariants && (
//             <div className="variant-section">
//               <h4>Select Variant:</h4>
//               <div className="variant-options">
//                 {variantAttributes.map(
//                   (v) =>
//                     v.attributes && (
//                       <button
//                         key={v.id}
//                         className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
//                         onClick={() => {
//                           setSelectedVariantIndex(v.index);
//                           toast.success(`Selected variant: ${v.attributes}`, {
//                             duration: 4000,
//                             position: 'top-center',
//                             style: {
//                               background: '#52c41a',
//                               color: '#fff',
//                               fontWeight: 'bold',
//                               borderRadius: '8px',
//                               padding: '16px',
//                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//                             },
//                           });
//                         }}
//                       >
//                         {v.attributes || `Variant #${v.index + 1}`}
//                       </button>
//                     )
//                 )}
//               </div>
//             </div>
//           )}
//           <div className="action-buttons">
//             <button
//               onClick={() => addToCart(false)}
//               className="add-to-cart-button"
//               disabled={isOutOfStock()}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//             >
//               Buy Now
//             </button>
//           </div>
//           <div className="seller-info">
//             <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
//             <Link to={`/seller/${product.seller_id}`} className="seller-link">
//               View Seller Profile
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="ratings-reviews-section">
//         <h3>Ratings & Reviews</h3>
//         <p className="by-verified">By verified customers</p>
//         <div className="rating-score">
//           <StarRatingDisplay rating={averageRating} />
//           <span className="rating-count">
//             ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
//           </span>
//         </div>
//         {reviews.length > 0 ? (
//           reviews.map((review, index) => (
//             <div key={index} className="review-item">
//               <div className="review-header">
//                 <strong className="review-author">{review.reviewer_name}</strong>
//                 <StarRatingDisplay rating={review.rating} />
//               </div>
//               <p className="review-text">{review.review_text}</p>
//               {review.reply_text && (
//                 <div className="review-reply">
//                   <strong>Seller Reply:</strong> {review.reply_text}
//                 </div>
//               )}
//               <small className="review-date">
//                 {new Date(review.created_at).toLocaleDateString('en-IN', {
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric',
//                 })}
//               </small>
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
//             {Object.entries(product.specifications).map(([key, value], idx) => (
//               <div key={idx} className="spec-item">
//                 <span className="spec-key">{key}</span>
//                 <span className="spec-value">{value}</span>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="no-specs">No specifications available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;