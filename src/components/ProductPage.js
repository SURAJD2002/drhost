

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
//       selectedVariant: activeVariant ? { ...activeVariant, attributes: activeVariant.attributes || {} } : null,
//       variantId: activeVariant?.id || null,
//       price: activeVariant?.price || product.price || 0,
//       original_price: activeVariant?.original_price || product.original_price || null,
//       discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//       images: activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : product.images,
//       stock: activeVariant?.stock !== undefined ? activeVariant.stock : product.stock,
//       quantity: 1,
//       uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}` // Unique identifier for cart item
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

//         // Sync local cart
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





// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoading, setImageLoading] = useState(false);

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

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoading(true);
//     // Preload adjacent images
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoading(false);
//   };

//   const handlePrevImage = () => {
//     const images = getDisplayedImages();
//     setImageLoading(true);
//     setFullScreenImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//   };

//   const handleNextImage = () => {
//     const images = getDisplayedImages();
//     setImageLoading(true);
//     setFullScreenImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//   };

//   const handleImageLoad = () => {
//     setImageLoading(false);
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
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
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
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
//               Hurry! Only {getActiveVariant()?.stock || product?.stock} left in stock!
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <TransformWrapper
//             initialScale={1}
//             minScale={1}
//             maxScale={3}
//             wheel={{ disabled: false }}
//             panning={{ disabled: false }}
//             onPanningStart={() => {}}
//             onZoom={(ref) => {
//               if (ref.state.scale > 1) {
//                 document.querySelector('.full-screen-image-content').style.cursor = 'grab';
//               } else {
//                 document.querySelector('.full-screen-image-content').style.cursor = 'default';
//               }
//             }}
//           >
//             {({ zoomIn, zoomOut, resetTransform }) => (
//               <>
//                 {imageLoading && (
//                   <div className="image-loading-spinner">
//                     <svg className="spinner" viewBox="0 0 50 50">
//                       <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                     </svg>
//                   </div>
//                 )}
//                 <TransformComponent>
//                   <img
//                     src={displayedImages[fullScreenImageIndex] || 'https://dummyimage.com/600'}
//                     alt={`${productName} Image ${fullScreenImageIndex + 1}`}
//                     onError={(e) => (e.target.src = 'https://dummyimage.com/600')}
//                     onLoad={handleImageLoad}
//                     className="full-screen-image-content"
//                     onClick={(e) => e.stopPropagation()}
//                   />
//                 </TransformComponent>
//                 <div className="zoom-controls">
//                   <button
//                     onClick={() => zoomIn()}
//                     className="zoom-btn zoom-in"
//                     aria-label="Zoom in"
//                   >
//                     +
//                   </button>
//                   <button
//                     onClick={() => zoomOut()}
//                     className="zoom-btn zoom-out"
//                     aria-label="Zoom out"
//                   >
//                     −
//                   </button>
//                   <button
//                     onClick={() => resetTransform()}
//                     className="zoom-btn zoom-reset"
//                     aria-label="Reset zoom"
//                   >
//                     ↺
//                   </button>
//                 </div>
//                 <button
//                   className="full-screen-close-btn"
//                   onClick={handleCloseFullScreen}
//                   aria-label="Close full screen image"
//                 >
//                   ×
//                 </button>
//                 {displayedImages.length > 1 && (
//                   <>
//                     <button
//                       className="full-screen-nav-btn prev"
//                       onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
//                       aria-label="Previous image"
//                     >
//                       ←
//                     </button>
//                     <button
//                       className="full-screen-nav-btn next"
//                       onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
//                       aria-label="Next image"
//                     >
//                       →
//                     </button>
//                     <div className="full-screen-dots">
//                       {displayedImages.map((_, i) => (
//                         <span
//                           key={i}
//                           className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                           onClick={(e) => { e.stopPropagation(); setFullScreenImageIndex(i); setImageLoading(true); }}
//                           role="button"
//                           aria-label={`View image ${i + 1}`}
//                           tabIndex={0}
//                           onKeyPress={(e) => e.key === 'Enter' && setFullScreenImageIndex(i) && setImageLoading(true)}
//                         />
//                       ))}
//                     </div>
//                   </>
//                 )}
//               </>
//             )}
//           </TransformWrapper>
//         </div>
//       )}

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
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoading, setImageLoading] = useState(false);

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

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoading(true);
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoading(false);
//   };

//   const handlePrevImage = () => {
//     const images = getDisplayedImages();
//     setImageLoading(true);
//     setFullScreenImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//   };

//   const handleNextImage = () => {
//     const images = getDisplayedImages();
//     setImageLoading(true);
//     setFullScreenImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//   };

//   const handleImageLoad = () => {
//     setImageLoading(false);
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
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
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
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
//               Hurry! Only {getActiveVariant()?.stock || product?.stock} left in stock!
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <TransformWrapper
//             initialScale={1}
//             minScale={1}
//             maxScale={3}
//             wheel={{ disabled: false }}
//             panning={{ disabled: false }}
//             doubleClick={{ mode: 'reset' }}
//             onPanningStart={() => {}}
//             onZoom={(ref) => {
//               if (ref.state.scale > 1) {
//                 document.querySelector('.full-screen-image-content').style.cursor = 'grab';
//               } else {
//                 document.querySelector('.full-screen-image-content').style.cursor = 'default';
//               }
//             }}
//           >
//             <TransformComponent>
//               {imageLoading && (
//                 <div className="image-loading-spinner">
//                   <svg className="spinner" viewBox="0 0 50 50">
//                     <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                   </svg>
//                 </div>
//               )}
//               <img
//                 src={displayedImages[fullScreenImageIndex] || 'https://dummyimage.com/600'}
//                 alt={`${productName} Image ${fullScreenImageIndex + 1}`}
//                 onError={(e) => (e.target.src = 'https://dummyimage.com/600')}
//                 onLoad={handleImageLoad}
//                 className="full-screen-image-content"
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </TransformComponent>
//             {displayedImages.length > 1 && (
//               <div className="full-screen-dots">
//                 {displayedImages.map((_, i) => (
//                   <span
//                     key={i}
//                     className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                     onClick={(e) => { e.stopPropagation(); setFullScreenImageIndex(i); setImageLoading(true); }}
//                     role="button"
//                     aria-label={`View image ${i + 1}`}
//                     tabIndex={0}
//                     onKeyPress={(e) => e.key === 'Enter' && setFullScreenImageIndex(i) && setImageLoading(true)}
//                   />
//                 ))}
//               </div>
//             )}
//           </TransformWrapper>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen image"
//           >
//             ×
//           </button>
//         </div>
//       )}

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


// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const fullScreenSliderRef = useRef(null);

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

//   const fullScreenSliderSettings = {
//     dots: false,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: false,
//     swipe: true,
//     draggable: true,
//     afterChange: (current) => setFullScreenImageIndex(current),
//     initialSlide: fullScreenImageIndex,
//   };

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   };

//   const handlePrevImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickPrev();
//     }
//   };

//   const handleNextImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickNext();
//     }
//   };

//   const handleImageLoad = (index) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
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
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
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
//               Hurry! Only {getActiveVariant()?.stock || product?.stock} left in stock!
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider {...fullScreenSliderSettings} ref={fullScreenSliderRef}>
//               {displayedImages.map((imgUrl, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={1}
//                     maxScale={3}
//                     wheel={{ disabled: false }}
//                     panning={{ disabled: false }}
//                     doubleClick={{ mode: 'reset' }}
//                     onZoom={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       if (ref.state.scale > 1) {
//                         slide.style.cursor = 'grab';
//                       } else {
//                         slide.style.cursor = 'default';
//                       }
//                     }}
//                   >
//                     <TransformComponent>
//                       {imageLoadingStates[i] && (
//                         <div className="image-loading-spinner">
//                           <svg className="spinner" viewBox="0 0 50 50">
//                             <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                           </svg>
//                         </div>
//                       )}
//                       <img
//                         src={imgUrl || 'https://dummyimage.com/600'}
//                         alt={`${productName} Image ${i + 1}`}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/600')}
//                         onLoad={() => handleImageLoad(i)}
//                         className="full-screen-image-content"
//                       />
//                     </TransformComponent>
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <div className="full-screen-dots">
//                 {displayedImages.map((_, i) => (
//                   <span
//                     key={i}
//                     className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       fullScreenSliderRef.current.slickGoTo(i);
//                       setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                     }}
//                     role="button"
//                     aria-label={`View image ${i + 1}`}
//                     tabIndex={0}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter') {
//                         fullScreenSliderRef.current.slickGoTo(i);
//                         setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                       }
//                     }}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen image"
//           >
//             ×
//           </button>
//         </div>
//       )}

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


// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const location = useLocation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);

//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
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
//       return false;
//     }
//     return true;
//   };

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       setError('No internet connection.');
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(latitude, longitude, store_name),
//           categories(id, name, is_restricted)
//         `)
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

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         navigate('/categories');
//         return;
//       }

//       setIsRestricted(productData.categories?.is_restricted || false);
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//         category_name: productData.categories?.name || 'Unknown Category',
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

//   const fullScreenSliderSettings = {
//     dots: false,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: false,
//     swipe: true,
//     draggable: true,
//     afterChange: (current) => setFullScreenImageIndex(current),
//     initialSlide: fullScreenImageIndex,
//   };

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   };

//   const handlePrevImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickPrev();
//     }
//   };

//   const handleNextImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickNext();
//     }
//   };

//   const handleImageLoad = (index) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to add to cart.', {
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
//       navigate('/categories');
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
//       uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}`,
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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to proceed to checkout.', {
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
//       navigate('/categories');
//       return;
//     }
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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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

//   const seoKeywords = isRestricted && !location.state?.fromCategories
//     ? 'ecommerce, Markeet, buy online'
//     : `${productName}, ${product.category_name === 'Grocery' ? 'groceries' : 'electronics, appliances, fashion, jewellery, gift, home decoration'}, ecommerce, Markeet, buy online`;

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={seoKeywords} />
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
//       <Toaster />

//       <button onClick={() => navigate('/products')} className="enhanced-back-btn">
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
//                       alt={productName}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={productName}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
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
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx} data-testid={`product-highlight-${idx}`}>{point.trim()}</li>
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
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider {...fullScreenSliderSettings} ref={fullScreenSliderRef}>
//               {displayedImages.map((imgUrl, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={1}
//                     maxScale={3}
//                     wheel={{ disabled: false }}
//                     panning={{ disabled: false }}
//                     doubleClick={{ mode: 'reset' }}
//                     onZoom={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       if (ref.state.scale > 1) {
//                         slide.style.cursor = 'grab';
//                       } else {
//                         slide.style.cursor = 'default';
//                       }
//                     }}
//                   >
//                     <TransformComponent>
//                       {imageLoadingStates[i] && (
//                         <div className="image-loading-spinner">
//                           <svg className="spinner" viewBox="0 0 50 50">
//                             <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                           </svg>
//                         </div>
//                       )}
//                       <img
//                         src={imgUrl || 'https://dummyimage.com/600'}
//                         alt={productName}
//                         onError={(e) => (e.target.src = 'https://dummyimage.com/600')}
//                         onLoad={() => handleImageLoad(i)}
//                         className="full-screen-image-content"
//                       />
//                     </TransformComponent>
//                   </TransformWrapper>
//                 </div>
//               ))}
//             </Slider>
//             {displayedImages.length > 1 && (
//               <div className="full-screen-dots">
//                 {displayedImages.map((_, i) => (
//                   <span
//                     key={i}
//                     className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       fullScreenSliderRef.current.slickGoTo(i);
//                       setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                     }}
//                     role="button"
//                     aria-label={`View image ${i + 1}`}
//                     tabIndex={0}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter') {
//                         fullScreenSliderRef.current.slickGoTo(i);
//                         setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                       }
//                     }}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen image"
//           >
//             ×
//           </button>
//         </div>
//       )}

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



// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const location = useLocation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);

//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
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
//       return false;
//     }
//     return true;
//   };

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       setError('No internet connection.');
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(latitude, longitude, store_name),
//           categories(id, name, is_restricted)
//         `)
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

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         navigate('/categories');
//         return;
//       }

//       setIsRestricted(productData.categories?.is_restricted || false);
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//         category_name: productData.categories?.name || 'Unknown Category',
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

//       // Fetch related products
//       const { data: relatedData, error: relatedError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           price,
//           images,
//           categories(name)
//         `)
//         .eq('categories.id', productData.categories?.id)
//         .neq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .limit(4);
//       if (relatedError) throw relatedError;

//       setRelatedProducts(relatedData.map(item => ({
//         ...item,
//         price: parseFloat(item.price) || 0,
//         category_name: item.categories?.name || 'Unknown Category',
//       })));

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

//   const fullScreenSliderSettings = {
//     dots: false,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: false,
//     swipe: true,
//     draggable: true,
//     afterChange: (current) => setFullScreenImageIndex(current),
//     initialSlide: fullScreenImageIndex,
//   };

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   };

//   const handlePrevImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickPrev();
//     }
//   };

//   const handleNextImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickNext();
//     }
//   };

//   const handleImageLoad = (index) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to add to cart.', {
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
//       navigate('/categories');
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
//       uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}`,
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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to proceed to checkout.', {
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
//       navigate('/categories');
//       return;
//     }
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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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

//   const seoKeywords = isRestricted && !location.state?.fromCategories
//     ? 'ecommerce, Markeet, buy online'
//     : `${productName}, ${product.category_name === 'Grocery' ? 'groceries' : 'electronics, appliances, fashion, jewellery, gift, home decoration'}, ecommerce, Markeet, buy online`;

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={seoKeywords} />
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
//       <Toaster />

//       <button onClick={() => navigate('/products')} className="enhanced-back-btn">
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
//                       alt={`${productName} - Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName} - Image 1`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
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
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx} data-testid={`product-highlight-${idx}`}>{point.trim()}</li>
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
//                         aria-label={`Select variant: ${v.attributes}`}
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
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider {...fullScreenSliderSettings} ref={fullScreenSliderRef}>
//               {displayedImages.map((imgUrl, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                     doubleClick={{ step: 0.5 }}
//                     panning={{ velocityDisabled: false }}
//                     onZoom={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       slide.style.cursor = ref.state.scale > 1 ? 'grab' : 'default';
//                     }}
//                     onPanning={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       slide.style.cursor = ref.state.scale > 1 ? 'grabbing' : 'default';
//                     }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={imgUrl || 'https://dummyimage.com/1200x800'}
//                             alt={`${productName} - Image ${i + 1}`}
//                             onError={(e) => (e.target.src = 'https://dummyimage.com/1200x800')}
//                             onLoad={() => handleImageLoad(i)}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button
//                             onClick={() => zoomIn()}
//                             aria-label="Zoom in"
//                             className="zoom-btn zoom-in"
//                           >
//                             +
//                           </button>
//                           <button
//                             onClick={() => zoomOut()}
//                             aria-label="Zoom out"
//                             className="zoom-btn zoom-out"
//                           >
//                             -
//                           </button>
//                           <button
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                             className="zoom-btn zoom-reset"
//                           >
//                             Reset
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
//                   onClick={handlePrevImage}
//                   aria-label="Previous image"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={handleNextImage}
//                   aria-label="Next image"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <span
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         fullScreenSliderRef.current.slickGoTo(i);
//                         setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                       }}
//                       role="button"
//                       aria-label={`View image ${i + 1}`}
//                       tabIndex={0}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter') {
//                           fullScreenSliderRef.current.slickGoTo(i);
//                           setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                         }
//                       }}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen image"
//           >
//             ×
//           </button>
//         </div>
//       )}

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

//       {relatedProducts.length > 0 && (
//         <div className="related-products-section">
//           <h3>Related Products</h3>
//           <div className="related-products-grid">
//             {relatedProducts.map((relatedProduct) => (
//               <Link
//                 key={relatedProduct.id}
//                 to={`/product/${relatedProduct.id}`}
//                 className="related-product-card"
//                 aria-label={`View ${relatedProduct.title}`}
//               >
//                 <img
//                   src={relatedProduct.images?.[0] || 'https://dummyimage.com/200'}
//                   alt={relatedProduct.title}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/200')}
//                   className="related-product-image"
//                   loading="lazy"
//                 />
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{relatedProduct.title}</h4>
//                   <p className="related-product-price">
//                     ₹{relatedProduct.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   <p className="related-product-category">{relatedProduct.category_name}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
//   const location = useLocation();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [reviews, setReviews] = useState([]);
//   const [relatedProducts, setRelatedProducts] = useState([]);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
//   const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
//   const [imageLoadingStates, setImageLoadingStates] = useState({});
//   const [isRestricted, setIsRestricted] = useState(false);
//   const fullScreenSliderRef = useRef(null);

//   const checkNetworkStatus = () => {
//     if (!navigator.onLine) {
//       toast.error('No internet connection. Please check your network and try again.', {
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
//       return false;
//     }
//     return true;
//   };

//   useEffect(() => {
//     setReviews([]);
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       setError('No internet connection.');
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(`
//           *,
//           sellers(latitude, longitude, store_name),
//           categories(id, name, is_restricted)
//         `)
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

//       if (productData.categories?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//         navigate('/categories');
//         return;
//       }

//       setIsRestricted(productData.categories?.is_restricted || false);
//       setProduct({
//         ...productData,
//         price: parseFloat(productData.price) || 0,
//         original_price: productData.original_price ? parseFloat(productData.original_price) : null,
//         discount_amount: productData.discount_amount ? parseFloat(productData.discount_amount) : 0,
//         category_name: productData.categories?.name || 'Unknown Category',
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

//       // Determine related category
//       let relatedCategoryName = productData.categories?.name || 'Unknown Category';
//       if (productData.categories?.name === 'Mobile') {
//         relatedCategoryName = 'Electronics';
//       } else if (productData.categories?.name === 'Fashion') {
//         relatedCategoryName = 'Jewellery';
//       }

//       // Fetch related products based on related category
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('id')
//         .eq('name', relatedCategoryName)
//         .single();
//       if (categoryError) throw categoryError;

//       const { data: relatedData, error: relatedError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           price,
//           images,
//           categories(name)
//         `)
//         .eq('categories.id', categoryData.id)
//         .neq('id', parseInt(id, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .limit(4);
//       if (relatedError) throw relatedError;

//       setRelatedProducts(relatedData.map(item => ({
//         ...item,
//         price: parseFloat(item.price) || 0,
//         category_name: item.categories?.name || 'Unknown Category',
//       })));

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

//   const fullScreenSliderSettings = {
//     dots: false,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     arrows: false,
//     swipe: true,
//     draggable: true,
//     afterChange: (current) => setFullScreenImageIndex(current),
//     initialSlide: fullScreenImageIndex,
//   };

//   const handleImageClick = (index) => {
//     setFullScreenImageIndex(index);
//     setIsFullScreenOpen(true);
//     setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
//     const images = getDisplayedImages();
//     const preloadIndices = [
//       index,
//       index === 0 ? images.length - 1 : index - 1,
//       index === images.length - 1 ? 0 : index + 1,
//     ];
//     preloadIndices.forEach((i) => {
//       const img = new Image();
//       img.src = images[i];
//     });
//   };

//   const handleCloseFullScreen = () => {
//     setIsFullScreenOpen(false);
//     setImageLoadingStates({});
//   };

//   const handlePrevImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickPrev();
//     }
//   };

//   const handleNextImage = () => {
//     if (fullScreenSliderRef.current) {
//       fullScreenSliderRef.current.slickNext();
//     }
//   };

//   const handleImageLoad = (index) => {
//     setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
//   };

//   const handleKeyDown = (e) => {
//     if (!isFullScreenOpen) return;
//     if (e.key === 'Escape') {
//       handleCloseFullScreen();
//     } else if (e.key === 'ArrowLeft') {
//       handlePrevImage();
//     } else if (e.key === 'ArrowRight') {
//       handleNextImage();
//     }
//   };

//   useEffect(() => {
//     if (isFullScreenOpen) {
//       document.addEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     }
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//       document.body.style.overflow = 'auto';
//     };
//   }, [isFullScreenOpen]);

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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to add to cart.', {
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
//       navigate('/categories');
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
//       uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}`,
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
//     if (isRestricted && !location.state?.fromCategories) {
//       toast.error('Please select this category from the categories page to proceed to checkout.', {
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
//       navigate('/categories');
//       return;
//     }
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
//   const productName = product.title || product.name || 'Product';
//   const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet with fast delivery.`;
//   const productPrice = getActiveVariant()?.price || product.price || 0;
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

//   const seoKeywords = isRestricted && !location.state?.fromCategories
//     ? 'ecommerce, Markeet, buy online'
//     : `${productName}, ${product.category_name === 'Grocery' ? 'groceries' : 'electronics, appliances, fashion, jewellery, gift, home decoration'}, ecommerce, Markeet, buy online`;

//   return (
//     <div className="product-page-container">
//       <Helmet>
//         <title>{productName} - Markeet</title>
//         <meta name="description" content={productDescription} />
//         <meta name="keywords" content={seoKeywords} />
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
//       <Toaster />

//       <button onClick={() => navigate('/products')} className="enhanced-back-btn">
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
//                       alt={`${productName} - Image ${i + 1}`}
//                       onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                       onClick={() => handleImageClick(i)}
//                       className="clickable-image"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={`View ${productName} image ${i + 1} in full screen`}
//                       onKeyPress={(e) => e.key === 'Enter' && handleImageClick(i)}
//                       loading="lazy"
//                     />
//                   </div>
//                 ))}
//               </Slider>
//             ) : (
//               <div className="single-image-wrapper">
//                 <img
//                   src={displayedImages[0]}
//                   alt={`${productName} - Image 1`}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/300')}
//                   onClick={() => handleImageClick(0)}
//                   className="clickable-image"
//                   role="button"
//                   tabIndex={0}
//                   aria-label={`View ${productName} image in full screen`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleImageClick(0)}
//                   loading="lazy"
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
//               Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock!
//             </p>
//           )}
//           <ul className="product-highlights">
//             {product.description?.split(';').filter((point) => point.trim()).map((point, idx) => (
//               <li key={idx} data-testid={`product-highlight-${idx}`}>{point.trim()}</li>
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
//                         aria-label={`Select variant: ${v.attributes}`}
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
//               aria-label={`Add ${productName} to cart`}
//             >
//               {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
//             </button>
//             <button
//               className="buy-now-button"
//               onClick={handleBuyNow}
//               disabled={isOutOfStock()}
//               aria-label={`Buy ${productName} now`}
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

//       {isFullScreenOpen && (
//         <div
//           className="full-screen-image"
//           role="dialog"
//           aria-label="Full screen image viewer"
//           onClick={handleCloseFullScreen}
//         >
//           <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
//             <Slider {...fullScreenSliderSettings} ref={fullScreenSliderRef}>
//               {displayedImages.map((imgUrl, i) => (
//                 <div key={i} className="full-screen-slide">
//                   <TransformWrapper
//                     initialScale={1}
//                     minScale={0.5}
//                     maxScale={4}
//                     wheel={{ step: 0.1 }}
//                     pinch={{ step: 5 }}
//                     doubleClick={{ step: 0.5 }}
//                     panning={{ velocityDisabled: false }}
//                     onZoom={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       slide.style.cursor = ref.state.scale > 1 ? 'grab' : 'default';
//                     }}
//                     onPanning={(ref) => {
//                       const slide = ref.instance.wrapperComponent;
//                       slide.style.cursor = ref.state.scale > 1 ? 'grabbing' : 'default';
//                     }}
//                   >
//                     {({ zoomIn, zoomOut, resetTransform }) => (
//                       <>
//                         <TransformComponent wrapperClass="transform-wrapper">
//                           {imageLoadingStates[i] && (
//                             <div className="image-loading-spinner">
//                               <svg className="spinner" viewBox="0 0 50 50">
//                                 <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//                               </svg>
//                             </div>
//                           )}
//                           <img
//                             src={imgUrl || 'https://dummyimage.com/1200x800'}
//                             alt={`${productName} - Image ${i + 1}`}
//                             onError={(e) => (e.target.src = 'https://dummyimage.com/1200x800')}
//                             onLoad={() => handleImageLoad(i)}
//                             className="full-screen-image-content"
//                             loading="eager"
//                           />
//                         </TransformComponent>
//                         <div className="zoom-controls">
//                           <button
//                             onClick={() => zoomIn()}
//                             aria-label="Zoom in"
//                             className="zoom-btn zoom-in"
//                           >
//                             +
//                           </button>
//                           <button
//                             onClick={() => zoomOut()}
//                             aria-label="Zoom out"
//                             className="zoom-btn zoom-out"
//                           >
//                             -
//                           </button>
//                           <button
//                             onClick={() => resetTransform()}
//                             aria-label="Reset zoom"
//                             className="zoom-btn zoom-reset"
//                           >
//                             Reset
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
//                   onClick={handlePrevImage}
//                   aria-label="Previous image"
//                 >
//                   ❮
//                 </button>
//                 <button
//                   className="full-screen-nav-btn next"
//                   onClick={handleNextImage}
//                   aria-label="Next image"
//                 >
//                   ❯
//                 </button>
//                 <div className="full-screen-dots">
//                   {displayedImages.map((_, i) => (
//                     <span
//                       key={i}
//                       className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         fullScreenSliderRef.current.slickGoTo(i);
//                         setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                       }}
//                       role="button"
//                       aria-label={`View image ${i + 1}`}
//                       tabIndex={0}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter') {
//                           fullScreenSliderRef.current.slickGoTo(i);
//                           setImageLoadingStates((prev) => ({ ...prev, [i]: true }));
//                         }
//                       }}
//                     />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//           <button
//             className="full-screen-close-btn"
//             onClick={handleCloseFullScreen}
//             aria-label="Close full screen image"
//           >
//             ×
//           </button>
//         </div>
//       )}

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

//       {relatedProducts.length > 0 && (
//         <div className="related-products-section">
//           <h3>Related Products</h3>
//           <div className="related-products-grid">
//             {relatedProducts.map((relatedProduct, index) => (
//               <Link
//                 key={relatedProduct.id}
//                 to={`/product/${relatedProduct.id}`}
//                 className="related-product-card"
//                 aria-label={`View ${relatedProduct.title}`}
//                 style={{ animationDelay: `${index * 0.1}s` }}
//               >
//                 <img
//                   src={relatedProduct.images?.[0] || 'https://dummyimage.com/200'}
//                   alt={relatedProduct.title}
//                   onError={(e) => (e.target.src = 'https://dummyimage.com/200')}
//                   className="related-product-image"
//                   loading="lazy"
//                 />
//                 <div className="related-product-info">
//                   <h4 className="related-product-title">{relatedProduct.title}</h4>
//                   <p className="related-product-price">
//                     ₹{relatedProduct.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </p>
//                   <p className="related-product-category">{relatedProduct.category_name}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
// const CURRENCY_FORMAT = 'en-IN';
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
//       const cartItem = {
//         id: product.id,
//         cartId: null,
//         title: product.title || product.name || 'Product',
//         selectedVariant: activeVariant ? { ...activeVariant } : null,
//         variantId: activeVariant?.id || null,
//         price: activeVariant?.price || product.price,
//         original_price: activeVariant?.original_price || product.original_price || null,
//         discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
//         images: getDisplayedImages(),
//         stock: activeVariant?.stock ?? product.stock,
//         quantity: 1,
//         uniqueKey: `${product.id}-${activeVariant?.id || 'no-variant'}`,
//       };

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         let updatedCart = [...cart];

//         if (session) {
//           const userId = session.user.id;
//           const { data: existingCartItem, error: fetchError } = await supabase
//             .from('cart')
//             .select('id, quantity')
//             .eq('user_id', userId)
//             .eq('product_id', product.id)
//             .eq('variant_id', activeVariant?.id || null)
//             .maybeSingle();
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
//                 variant_id: activeVariant?.id || null,
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
//                       alt={`${productName} - Image ${i + 1}`}
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
//                             alt={`${productName} - Image ${i + 1}`}
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


// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
// const CURRENCY_FORMAT = 'en-IN';
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
//                       alt={`${productName} - Image ${i + 1}`}
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
//                             alt={`${productName} - Image ${i + 1}`}
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
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
// const CURRENCY_FORMAT = 'en-IN';
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
//                       alt={`${productName} - Image ${i + 1}`}
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
//                             alt={`${productName} - Image ${i + 1}`}
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
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
// const CURRENCY_FORMAT = 'en-IN';
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
//                       alt={`${productName} - Image ${i + 1}`}
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
//                             alt={`${productName} - Image ${i + 1}`}
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
// import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
// const CURRENCY_FORMAT = 'en-IN';
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
//                       alt={`${productName} - Image ${i + 1}`}
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
//                             alt={`${productName} - Image ${i + 1}`}
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





import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { LocationContext } from '../App';
import '../style/ProductPage.css';
import { Helmet } from 'react-helmet-async';
import icon from '../assets/icon.png';

// Constants
const DEFAULT_IMAGE = 'https://dummyimage.com/300';
const FULLSCREEN_DEFAULT_IMAGE = 'https://dummyimage.com/1200x800';
const CURRENCY_FORMAT = 'en-IN';
const CACHE_KEY = 'relatedCache';
const TOAST_STYLES = {
  error: {
    background: '#ff4d4f',
    color: '#fff',
    fontWeight: '500',
    borderRadius: 'var(--border-radius)',
    padding: 'calc(var(--spacing-unit) * 2)',
  },
  success: {
    background: '#10b981',
    color: '#fff',
    fontWeight: '500',
    borderRadius: 'var(--border-radius)',
    padding: 'calc(var(--spacing-unit) * 2)',
  },
  loading: {
    background: '#3b82f6',
    color: '#fff',
    fontWeight: '500',
    borderRadius: 'var(--border-radius)',
    padding: 'calc(var(--spacing-unit) * 2)',
  },
};

// Utility to format currency
const formatCurrency = (value) =>
  `₹${(parseFloat(value) || 0).toLocaleString(CURRENCY_FORMAT, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Utility to calculate distance
const calculateDistance = (userLoc, sellerLoc) => {
  if (
    !userLoc?.lat ||
    !userLoc?.lon ||
    !sellerLoc?.latitude ||
    !sellerLoc?.longitude ||
    sellerLoc.latitude === 0 ||
    sellerLoc.longitude === 0
  ) {
    return null;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((sellerLoc.latitude - userLoc.lat) * Math.PI) / 180;
  const dLon = ((sellerLoc.longitude - userLoc.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLoc.lat * (Math.PI / 180)) *
      Math.cos(sellerLoc.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// StarRatingDisplay component
const StarRatingDisplay = React.memo(({ rating = 0 }) => (
  <div className="star-rating-display" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${star <= Math.round(rating) ? 'filled' : ''}`}
        aria-hidden="true"
      >
        ★
      </span>
    ))}
  </div>
));

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { buyerLocation, setBuyerLocation } = useContext(LocationContext);
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
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [isRestricted, setIsRestricted] = useState(false);
  const fullScreenSliderRef = useRef(null);
  const relatedCache = useRef(JSON.parse(localStorage.getItem(CACHE_KEY)) || {});
  const maxLocationRetries = 3;

  const checkNetworkStatus = useCallback(() => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network.', {
        duration: 4000,
        position: 'top-center',
        style: TOAST_STYLES.error,
      });
      return false;
    }
    return true;
  }, []);

  const retryLocationDetection = useCallback(() => {
    if (locationLoading || locationRetries >= maxLocationRetries) {
      if (locationRetries >= maxLocationRetries) {
        toast.error('Maximum location detection attempts reached. Using default location (Bengaluru).', {
          duration: 6000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        setBuyerLocation({ lat: 12.9716, lon: 77.5946 });
        setLocationLoading(false);
        setLocationRetries(0);
      }
      return;
    }

    setLocationLoading(true);
    setLocationRetries((prev) => prev + 1);
    console.log('Retrying location detection...', { attempt: locationRetries + 1 });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const detectedLocation = { lat: latitude, lon: longitude };
          setBuyerLocation(detectedLocation);
          setLocationLoading(false);
          setLocationRetries(0);
          console.log('Location detected on retry:', detectedLocation);
        },
        (error) => {
          console.warn('Location detection failed on retry:', error);
          const defaultLocation = { lat: 12.9716, lon: 77.5946 };
          setBuyerLocation(defaultLocation);
          setLocationLoading(false);
          console.log('Using default location on retry (Bengaluru):', defaultLocation);
          toast.error(`Location detection failed: ${error.message}. Using default location (Bengaluru).`, {
            duration: 6000,
            position: 'top-center',
            style: TOAST_STYLES.error,
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      const defaultLocation = { lat: 12.9716, lon: 77.5946 };
      setBuyerLocation(defaultLocation);
      setLocationLoading(false);
      console.log('No geolocation support, using default location (Bengaluru):', defaultLocation);
      toast.error('Geolocation not supported. Using default location (Bengaluru).', {
        duration: 6000,
        position: 'top-center',
        style: TOAST_STYLES.error,
      });
    }
  }, [setBuyerLocation, locationLoading, locationRetries]);

  const getActiveVariant = useMemo(
    () => () =>
      variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
        ? variants[selectedVariantIndex]
        : null,
    [variants, selectedVariantIndex],
  );

  const getDisplayedImages = useMemo(
    () => () => {
      const activeVariant = getActiveVariant();
      const productImages = product?.images || [];
      const variantImages = activeVariant?.images || [];
      const mergedImages = [...new Set([...productImages, ...variantImages])];
      return mergedImages.length > 0 ? mergedImages : [DEFAULT_IMAGE];
    },
    [product, getActiveVariant],
  );

  const isOutOfStock = useMemo(
    () => () => {
      const activeVariant = getActiveVariant();
      const stock = activeVariant?.stock ?? product?.stock ?? 0;
      return stock <= 0;
    },
    [product, getActiveVariant],
  );

  const isLowStock = useMemo(
    () => () => {
      const activeVariant = getActiveVariant();
      const stock = activeVariant?.stock ?? product?.stock ?? 0;
      return stock > 0 && stock < 5;
    },
    [product, getActiveVariant],
  );

  const averageRating = useMemo(
    () =>
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0,
    [reviews],
  );

  const fetchProductReviews = useCallback(async (productId) => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id, rating, review_text, reply_text, created_at,
          profiles!reviews_reviewer_id_fkey(full_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (reviewsError) {
        console.error('Reviews fetch error:', reviewsError);
        throw new Error('Failed to load reviews');
      }

      return (reviewsData || []).map((review) => ({
        ...review,
        reviewer_name: review.profiles?.full_name || 'Anonymous',
      }));
    } catch (err) {
      console.error('Reviews fetch error:', err);
      toast.error('Failed to load reviews. Please try again later.', {
        duration: 4000,
        position: 'top-center',
        style: TOAST_STYLES.error,
      });
      return [];
    }
  }, []);

  const fetchProductAndVariants = useCallback(async () => {
    if (!checkNetworkStatus()) {
      setError('No internet connection.');
      setLoading(false);
      return;
    }

    if (!buyerLocation?.lat || !buyerLocation?.lon) {
      console.warn('No buyer location available, attempting to detect');
      retryLocationDetection();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          sellers(id, store_name, latitude, longitude),
          categories(id, name, is_restricted, max_delivery_radius_km)
        `)
        .eq('id', parseInt(id, 10))
        .eq('is_approved', true)
        .eq('status', 'active')
        .maybeSingle();
      if (productError) throw new Error(`Product fetch error: ${productError.message}`);
      if (!productData) {
        setError('Product not found.');
        return;
      }

      const distance = calculateDistance(buyerLocation, {
        latitude: productData.sellers?.latitude,
        longitude: productData.sellers?.longitude,
      });
      const effectiveRadius = productData.delivery_radius_km || productData.categories?.max_delivery_radius_km || 40;
      if (distance === null || distance > effectiveRadius) {
        toast.error(
          `Product is not available in your area (${distance?.toFixed(2) || 'unknown'}km > ${effectiveRadius}km).`,
          {
            duration: 4000,
            position: 'top-center',
            style: TOAST_STYLES.error,
          },
        );
        setError('Product is not available in your area.');
        navigate('/products');
        return;
      }

      if (productData.categories?.is_restricted && !location.state?.fromCategories) {
        toast.error('Please access this restricted category via the Categories page.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        navigate('/categories');
        return;
      }

      const normalizedProduct = {
        ...productData,
        price: parseFloat(productData.price) || 0,
        original_price: parseFloat(productData.original_price) || null,
        discount_amount: parseFloat(productData.discount_amount) || 0,
        category_name: productData.categories?.name || 'Unknown Category',
        category_id: productData.categories?.id || null,
      };
      setProduct(normalizedProduct);
      setIsRestricted(productData.categories?.is_restricted || false);

      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, discount_amount, stock, attributes, images')
        .eq('product_id', parseInt(id, 10))
        .eq('status', 'active');
      if (variantError) throw new Error(`Variants fetch error: ${variantError.message}`);

      const validVariants = (variantData || [])
        .map((variant) => ({
          ...variant,
          price: parseFloat(variant.price) || 0,
          original_price: parseFloat(variant.original_price) || null,
          discount_amount: parseFloat(variant.discount_amount) || 0,
          stock: variant.stock ?? 0,
          images: variant.images && variant.images.length ? variant.images : productData.images,
        }))
        .filter((variant) => {
          const attributes = variant.attributes || {};
          return Object.values(attributes).some((val) => val && val.trim());
        });
      setVariants(validVariants);
      setSelectedVariantIndex(validVariants.length > 0 ? 0 : -1);

      const reviewsData = await fetchProductReviews(parseInt(id, 10));
      setReviews(reviewsData);
    } catch (err) {
      console.error('Product fetch error:', err);
      setError(`Failed to load product: ${err.message}`);
      toast.error(`Failed to load product. Please try again.`, {
        duration: 4000,
        position: 'top-center',
        style: TOAST_STYLES.error,
      });
    } finally {
      setLoading(false);
    }
  }, [id, location.state, navigate, checkNetworkStatus, buyerLocation, retryLocationDetection, fetchProductReviews]);

  const fetchRelatedProducts = useCallback(
    async (product, retryCount = 0) => {
      if (!product || !product.category_id || !checkNetworkStatus()) {
        setRelatedProducts([]);
        setIsRelatedLoading(false);
        return;
      }

      if (!buyerLocation?.lat || !buyerLocation?.lon) {
        console.warn('No buyer location available for related products');
        setRelatedProducts([]);
        setIsRelatedLoading(false);
        toast.error('Location required to show related products. Please enable location or retry.', {
          duration: 6000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        retryLocationDetection();
        return;
      }

      setIsRelatedLoading(true);
      const cacheKey = `${product.id}-${product.category_id}-${Math.round(buyerLocation.lat * 1000) / 1000}-${Math.round(buyerLocation.lon * 1000) / 1000}`;
      if (relatedCache.current[cacheKey]) {
        setRelatedProducts(shuffleArray(relatedCache.current[cacheKey]));
        setIsRelatedLoading(false);
        return;
      }

      try {
        // Fetch non-restricted category IDs
        const { data: nonRestrictedCategories, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('is_restricted', false);
        if (categoryError) throw new Error(`Category fetch error: ${categoryError.message}`);
        const nonRestrictedCategoryIds = nonRestrictedCategories.map((cat) => cat.id);

        const isCategoryRestricted = !nonRestrictedCategoryIds.includes(product.category_id);
        if (isCategoryRestricted && !location.state?.fromCategories) {
          console.warn('Related products skipped: Category is restricted and not accessed via Categories page');
          setRelatedProducts([]);
          setIsRelatedLoading(false);
          return;
        }

        // Try RPC first
        let relatedData, relatedError;
        try {
          ({ data: relatedData, error: relatedError } = await supabase.rpc(
            'get_related_products_nearby',
            {
              p_limit: 10,
              p_product_id: parseInt(product.id),
              p_user_lat: parseFloat(buyerLocation.lat.toFixed(8)),
              p_user_lon: parseFloat(buyerLocation.lon.toFixed(8)),
            }
          ));
        } catch (rpcError) {
          console.error('RPC call error:', rpcError);
          relatedError = rpcError;
        }

        if (relatedError) {
          console.warn('RPC failed, falling back to manual query:', relatedError.message);
          // Fallback query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('products')
            .select(`
              id, title, price, original_price, discount_amount, images, seller_id, category_id,
              delivery_radius_km, categories(name, max_delivery_radius_km),
              sellers(latitude, longitude)
            `)
            .eq('category_id', product.category_id)
            .neq('id', product.id)
            .eq('is_approved', true)
            .eq('status', 'active')
            .limit(10);
          if (fallbackError) throw new Error(`Fallback fetch error: ${fallbackError.message}`);
          relatedData = fallbackData;
        }

        if (!relatedData || relatedData.length === 0) {
          setRelatedProducts([]);
          setIsRelatedLoading(false);
          return;
        }

        // Fetch category details if not included in RPC
        const { data: categoryData, error: catDataError } = await supabase
          .from('categories')
          .select('id, max_delivery_radius_km')
          .in('id', relatedData.map((item) => item.category_id));
        if (catDataError) throw new Error(`Category data fetch error: ${catDataError.message}`);

        // Normalize and filter related products
        const normalized = relatedData
          .map((item) => {
            const seller = item.sellers || relatedData.find((d) => d.seller_id === item.seller_id);
            const category = categoryData.find((c) => c.id === item.category_id);
            const distance = seller ? calculateDistance(buyerLocation, {
              latitude: seller.latitude,
              longitude: seller.longitude,
            }) : null;
            const effectiveRadius = item.delivery_radius_km || category?.max_delivery_radius_km || 40;

            return {
              ...item,
              price: parseFloat(item.price) || 0,
              originalPrice: item.original_price ? parseFloat(item.original_price) : null,
              discountAmount: item.discount_amount ? parseFloat(item.discount_amount) : 0,
              category_name: item.categories?.name || item.category_name || 'Unknown Category',
              images: Array.isArray(item.images) ? item.images : [item.images].filter(Boolean),
              deliveryRadius: effectiveRadius,
              distance: distance !== null ? parseFloat(distance.toFixed(2)) : null,
            };
          })
          .filter((item) => {
            if (item.id === product.id) return false;
            if (item.distance === null || item.distance > item.deliveryRadius) return false;
            if (isCategoryRestricted && !location.state?.fromCategories) return false;
            return true;
          });

        const shuffled = shuffleArray(normalized).slice(0, 8);
        relatedCache.current[cacheKey] = shuffled;
        localStorage.setItem(CACHE_KEY, JSON.stringify(relatedCache.current));
        setRelatedProducts(shuffled);
      } catch (err) {
        console.error('Related products fetch error:', err);
        if (retryCount < 2) {
          console.log(`Retrying related products fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchRelatedProducts(product, retryCount + 1), 1000);
          return;
        }
        setRelatedProducts([]);
        toast.error('Unable to load related products. Please try again later.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
      } finally {
        setIsRelatedLoading(false);
      }
    },
    [checkNetworkStatus, buyerLocation, location.state, retryLocationDetection],
  );

  const handleImageClick = useCallback(
    (index) => {
      setFullScreenImageIndex(index);
      setIsFullScreenOpen(true);
      setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
      const images = getDisplayedImages();
      const preloadIndices = [
        index,
        index === 0 ? images.length - 1 : index - 1,
        index === images.length - 1 ? 0 : index + 1,
      ];
      preloadIndices.forEach((i) => {
        const img = new Image();
        img.src = images[i];
      });
    },
    [getDisplayedImages],
  );

  const handleCloseFullScreen = useCallback(() => {
    setIsFullScreenOpen(false);
    setImageLoadingStates({});
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isFullScreenOpen) return;
      if (e.key === 'Escape') {
        handleCloseFullScreen();
      } else if (e.key === 'ArrowLeft') {
        fullScreenSliderRef.current?.slickPrev();
      } else if (e.key === 'ArrowRight') {
        fullScreenSliderRef.current?.slickNext();
      }
    },
    [isFullScreenOpen, handleCloseFullScreen],
  );

  const addToCart = useCallback(
    async (redirectToCart = false) => {
      if (!product || isOutOfStock()) {
        toast.error(isOutOfStock() ? 'This item is out of stock.' : 'Product not available.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        return;
      }
      if (isRestricted && !location.state?.fromCategories) {
        toast.error('Please access this restricted category via the Categories page.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        navigate('/categories');
        return;
      }

      const activeVariant = getActiveVariant();
      const variantId = activeVariant ? activeVariant.id : null;

      if (variantId !== null && !Number.isInteger(variantId)) {
        toast.error('Invalid variant selection.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
        return;
      }

      const cartItem = {
        id: product.id,
        cartId: null,
        title: product.title || product.name || 'Product',
        selectedVariant: activeVariant ? { ...activeVariant } : null,
        variantId,
        price: activeVariant?.price || product.price,
        original_price: activeVariant?.original_price || product.original_price || null,
        discount_amount: activeVariant?.discount_amount || product.discount_amount || 0,
        images: getDisplayedImages(),
        stock: activeVariant?.stock ?? product.stock,
        quantity: 1,
        uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
      };

      try {
        const { data: { session } } = await supabase.auth.getSession();
        let updatedCart = [...cart];

        if (session) {
          const userId = session.user.id;
          let query = supabase
            .from('cart')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', product.id);

          if (variantId !== null) {
            query = query.eq('variant_id', variantId);
          } else {
            query = query.is('variant_id', null);
          }

          const { data: existingCartItem, error: fetchError } = await query.maybeSingle();
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Cart fetch error:', fetchError);
            throw new Error('Failed to check cart');
          }

          const newQuantity = (existingCartItem?.quantity || 0) + 1;
          if (newQuantity > cartItem.stock) {
            toast.error('Exceeds available stock.', {
              duration: 4000,
              position: 'top-center',
              style: TOAST_STYLES.error,
            });
            return;
          }

          if (existingCartItem) {
            const { data, error: upsertError } = await supabase
              .from('cart')
              .update({ quantity: newQuantity })
              .eq('id', existingCartItem.id)
              .select()
              .single();
            if (upsertError) {
              console.error('Cart update error:', upsertError);
              throw new Error('Failed to update cart');
            }
            cartItem.cartId = data.id;
          } else {
            const { data, error: insertError } = await supabase
              .from('cart')
              .insert({
                user_id: userId,
                product_id: product.id,
                variant_id: variantId,
                quantity: 1,
                price: cartItem.price,
                title: cartItem.title,
              })
              .select()
              .single();
            if (insertError) {
              console.error('Cart insert error:', insertError);
              throw new Error('Failed to add to cart');
            }
            cartItem.cartId = data.id;
          }
        }

        const existingLocalItemIndex = cart.findIndex(
          (item) => item.uniqueKey === cartItem.uniqueKey,
        );
        if (existingLocalItemIndex !== -1) {
          updatedCart = cart.map((item, index) =>
            index === existingLocalItemIndex
              ? { ...item, quantity: item.quantity + 1, cartId: cartItem.cartId }
              : item,
          );
        } else {
          updatedCart = [...cart, cartItem];
        }
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        toast.success(`${cartItem.title} added to cart!`, {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.success,
        });

        if (redirectToCart) {
          toast.loading('Redirecting to cart...', {
            duration: 2000,
            position: 'top-center',
            style: TOAST_STYLES.loading,
          });
          setTimeout(() => navigate('/cart'), 2000);
        }
      } catch (err) {
        console.error('Add to cart error:', err);
        toast.error('Failed to add to cart. Please try again.', {
          duration: 4000,
          position: 'top-center',
          style: TOAST_STYLES.error,
        });
      }
    },
    [product, cart, navigate, isRestricted, location.state, getActiveVariant, getDisplayedImages, isOutOfStock],
  );

  useEffect(() => {
    if (buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
      fetchProductAndVariants();
    } else if (!locationLoading) {
      retryLocationDetection();
    }
  }, [buyerLocation, locationLoading, retryLocationDetection, fetchProductAndVariants]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (product && buyerLocation?.lat && buyerLocation?.lon && !locationLoading) {
      fetchRelatedProducts(product);
    }
  }, [product, buyerLocation, locationLoading, fetchRelatedProducts]);

  if (loading || locationLoading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
          <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
        </svg>
        <span>{locationLoading ? 'Detecting location...' : 'Loading...'}</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error" role="alert" aria-live="assertive">
        {error || 'Product not found.'}
        <div className="error-actions">
          <button
            onClick={retryLocationDetection}
            className="retry-btn"
            aria-label="Retry loading product"
            disabled={locationLoading}
          >
            Retry Location
          </button>
          <button
            onClick={() => navigate('/products')}
            className="back-btn"
            aria-label="Back to products"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const displayedImages = getDisplayedImages();
  const productName = product.title || product.name || 'Product';
  const productDescription = product.description?.split(';')[0]?.trim() || `Buy ${productName} on Markeet.`;
  const productUrl = `https://www.markeet.com/product/${id}`;
  const availability = isOutOfStock() ? 'http://schema.org/OutOfStock' : 'http://schema.org/InStock';
  const variantAttributes = variants
    .map((v, index) => ({
      id: v.id,
      index,
      attributes: Object.entries(v.attributes || {})
        .filter(([key, val]) => val && val.trim() && key !== 'attribute1')
        .map(([key, val]) => `${key}: ${val}`)
        .join(', '),
    }))
    .filter((v) => v.attributes);

  return (
    <div className="product-page-container">
      <Helmet>
        <title>{`${productName} - Markeet`}</title>
        <meta name="description" content={productDescription} />
        <meta name="keywords" content={`${productName}, ${product.category_name}, ecommerce, Markeet`} />
        <link rel="canonical" href={productUrl} />
        <meta property="og:title" content={`${productName} - Markeet`} />
        <meta property="og:description" content={productDescription} />
        <meta property="og:image" content={displayedImages[0]} />
        <meta property="og:url" content={productUrl} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productName,
            description: productDescription,
            image: displayedImages,
            category: product.category_name,
            offers: {
              '@type': 'Offer',
              price: getActiveVariant()?.price || product.price,
              priceCurrency: 'INR',
              availability,
              seller: {
                '@type': 'Organization',
                name: product.sellers?.store_name || 'Markeet Seller',
              },
            },
            aggregateRating: reviews.length > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: averageRating.toFixed(1),
                  reviewCount: reviews.length,
                }
              : null,
            review: reviews.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.reviewer_name },
              reviewRating: { '@type': 'Rating', ratingValue: r.rating },
              reviewBody: r.review_text,
              datePublished: r.created_at,
            })),
          })}
        </script>
      </Helmet>
      <Toaster />

      <button
        onClick={() => navigate('/products')}
        className="enhanced-back-btn"
        aria-label="Back to products"
      >
        ← Back to Products
      </button>

      <div className="main-content">
        <div className="product-image-section">
          <div className="image-slider-container">
            {displayedImages.length > 1 ? (
              <Slider
                dots
                infinite
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                arrows
                autoplay={false}
                className="image-slider"
              >
                {displayedImages.map((img, i) => (
                  <div key={i} className="slider-image-wrapper">
                    <img
                      src={img}
                      alt={`${productName} - ${i + 1}`}
                      onClick={() => handleImageClick(i)}
                      onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                      className="clickable-image"
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${productName} - ${i + 1} in full screen`}
                      onKeyDown={(e) => e.key === 'Enter' && handleImageClick(i)}
                      loading="lazy"
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="single-image-wrapper">
                <img
                  src={displayedImages[0]}
                  alt={productName}
                  onClick={() => handleImageClick(0)}
                  onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                  className="clickable-image"
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${productName} in full screen`}
                  onKeyDown={(e) => e.key === 'Enter' && handleImageClick(0)}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        <div className="product-details-section">
          <h1 className="product-title">{productName}</h1>
          <div
            className={`price-section ${
              getActiveVariant()?.original_price || product.original_price ? 'offer-highlight' : ''
            }`}
          >
            <span className="current-price">{formatCurrency(getActiveVariant()?.price || product.price)}</span>
            {(getActiveVariant()?.original_price || product.original_price) && (
              <span className="original-price">
                {formatCurrency(getActiveVariant()?.original_price || product.original_price)}
              </span>
            )}
            {(getActiveVariant()?.discount_amount || product.discount_amount) > 0 && (
              <span className="discount">
                Save {formatCurrency(getActiveVariant()?.discount_amount || product.discount_amount)}
              </span>
            )}
          </div>
          {isLowStock() && (
            <p className="low-stock-warning" aria-live="polite">
              Hurry! Only {getActiveVariant()?.stock || product.stock} left in stock.
            </p>
          )}
          <ul className="product-highlights">
            {product.description?.split(';').filter(Boolean).map((point, i) => (
              <li key={i}>{point.trim()}</li>
            )) || <li>No description available.</li>}
          </ul>
          {variantAttributes.length > 0 && (
            <div className="variant-section">
              <h4 id="variant-section-label">Select Variant</h4>
              <div
                role="radiogroup"
                aria-labelledby="variant-section-label"
                className="variant-options"
              >
                {variantAttributes.map((v) => (
                  <button
                    key={v.id}
                    className={`variant-button ${v.index === selectedVariantIndex ? 'active' : ''}`}
                    onClick={() => setSelectedVariantIndex(v.index)}
                    aria-label={`Select variant: ${v.attributes}`}
                    role="radio"
                    aria-checked={v.index === selectedVariantIndex}
                  >
                    {v.attributes}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="action-buttons">
            <button
              onClick={() => addToCart(false)}
              className="add-to-cart-button"
              disabled={isOutOfStock()}
              aria-label={`Add ${productName} to cart`}
            >
              {isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={() => addToCart(true)}
              className="buy-now-button"
              disabled={isOutOfStock()}
              aria-label={`Buy ${productName} now`}
            >
              Buy Now
            </button>
          </div>
          <div className="seller-info">
            <p>Seller: {product.sellers?.store_name || 'Unknown Seller'}</p>
            <Link
              to={`/seller/${product.seller_id}`}
              className="seller-link"
              aria-label={`View profile of ${product.sellers?.store_name || 'seller'}`}
            >
              View Seller Profile
            </Link>
          </div>
        </div>
      </div>

      {isFullScreenOpen && (
        <div
          className="full-screen-image"
          role="dialog"
          aria-label="Full screen image viewer"
          onClick={handleCloseFullScreen}
        >
          <div className="full-screen-slider-container" onClick={(e) => e.stopPropagation()}>
            <Slider
              ref={fullScreenSliderRef}
              dots={false}
              infinite
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              arrows={false}
              initialSlide={fullScreenImageIndex}
              afterChange={setFullScreenImageIndex}
            >
              {displayedImages.map((img, i) => (
                <div key={i} className="full-screen-slide">
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    wheel={{ step: 0.1 }}
                    pinch={{ step: 5 }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <TransformComponent wrapperClass="transform-wrapper">
                          {imageLoadingStates[i] && (
                            <div className="image-loading-spinner">
                              <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
                                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
                              </svg>
                            </div>
                          )}
                          <img
                            src={img}
                            alt={`${productName} - ${i + 1}`}
                            onError={(e) => (e.target.src = FULLSCREEN_DEFAULT_IMAGE)}
                            onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [i]: false }))}
                            className="full-screen-image-content"
                            loading="eager"
                          />
                        </TransformComponent>
                        <div className="zoom-controls">
                          <button className="zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
                            +
                          </button>
                          <button className="zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
                            -
                          </button>
                          <button
                            className="zoom-btn"
                            onClick={() => resetTransform()}
                            aria-label="Reset zoom"
                          >
                            ↺
                          </button>
                        </div>
                      </>
                    )}
                  </TransformWrapper>
                </div>
              ))}
            </Slider>
            {displayedImages.length > 1 && (
              <>
                <button
                  className="full-screen-nav-btn prev"
                  onClick={() => fullScreenSliderRef.current?.slickPrev()}
                  aria-label="Previous image"
                >
                  ❮
                </button>
                <button
                  className="full-screen-nav-btn next"
                  onClick={() => fullScreenSliderRef.current?.slickNext()}
                  aria-label="Next image"
                >
                  ❯
                </button>
                <div className="full-screen-dots">
                  {displayedImages.map((_, i) => (
                    <button
                      key={i}
                      className={`full-screen-dot ${i === fullScreenImageIndex ? 'active' : ''}`}
                      onClick={() => fullScreenSliderRef.current?.slickGoTo(i)}
                      aria-label={`Go to image ${i + 1}`}
                      aria-current={i === fullScreenImageIndex}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            className="full-screen-close-btn"
            onClick={handleCloseFullScreen}
            aria-label="Close full screen viewer"
          >
            ×
          </button>
        </div>
      )}

      <div className="ratings-reviews-section">
        <h3>Ratings & Reviews</h3>
        <div className="rating-score">
          <StarRatingDisplay rating={averageRating} />
          <span className="rating-count">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        {reviews.length > 0 ? (
          reviews.map((review, i) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <span className="review-author">{review.reviewer_name}</span>
                <StarRatingDisplay rating={review.rating} />
              </div>
              <p className="review-text">{review.review_text}</p>
              {review.reply_text && (
                <p className="review-reply">Seller Reply: {review.reply_text}</p>
              )}
              <time className="review-date" dateTime={review.created_at}>
                {new Date(review.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
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
            {Object.entries(product.specifications).map(([key, value], i) => (
              <div key={i} className="spec-item">
                <span className="spec-key">{key}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-specs">No specifications available.</p>
        )}
      </div>

      <div className="related-products-section">
        <h3>Related Products</h3>
        {isRelatedLoading ? (
          <div className="related-products-loading">
            <p>Fetching related products...</p>
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
              <div
                key={item.id}
                className="related-product-card"
                onClick={() => navigate(`/product/${item.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${item.id}`)}
                aria-label={`View ${item.title} in ${item.category_name}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="related-product-image-wrapper">
                  {item.discountAmount > 0 && (
                    <span className="related-offer-badge">
                      <span className="offer-label">Offer!</span>
                      Save ₹{item.discountAmount.toFixed(2)}
                    </span>
                  )}
                  <img
                    src={item.images?.[0] || DEFAULT_IMAGE}
                    alt={item.title}
                    onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                    className="related-product-image"
                    loading="lazy"
                  />
                </div>
                <div className="related-product-info">
                  <h4 className="related-product-title">{item.title}</h4>
                  <div className="related-product-price-section">
                    <p className="related-product-price">{formatCurrency(item.price)}</p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="related-product-original-price">{formatCurrency(item.originalPrice)}</p>
                    )}
                  </div>
                  <p className="related-product-category">{item.category_name}</p>
                  {item.distance && (
                    <p className="related-product-distance">{item.distance.toFixed(1)} km away</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="related-products-empty">
            <p className="no-specs">No related products available in your area.</p>
            <p className="no-specs-subtitle">Try browsing other categories or check back later.</p>
          </div>
        )}
      </div>

      <img
        src={icon}
        alt="Markeet Logo"
        className="product-icon"
      />
    </div>
  );
}

export default ProductPage;