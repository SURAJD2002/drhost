// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// function ProductPage() {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
//   const [reviews, setReviews] = useState([]);

//   useEffect(() => {
//     // Detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProduct(userLocation);
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProduct(bengaluruLocation);
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProduct(bengaluruLocation);
//     }

//     // Fetch reviews
//     fetchReviews();
//   }, [id]);

//   const fetchProduct = async (userLocation) => {
//     setLoading(true);
//     try {
//       if (!userLocation || !id) return;

//       // Fetch product with seller details and distance
//       let { data, error: productError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: true, // Allow long-distance products
//       }).eq('id', parseInt(id, 10));

//       if (productError) throw productError;

//       if (data && data.length > 0) {
//         setProduct(data[0]);
//       } else {
//         // Fallback to direct product query with seller details
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('*, sellers(location, allows_long_distance, store_name)')
//           .eq('id', parseInt(id, 10))
//           .eq('is_approved', true)
//           .single();
//         if (fallbackError) throw fallbackError;
//         setProduct(fallbackData);
//       }
//     } catch (error) {
//       console.error('Error fetching product:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReviews = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('reviews')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (error) throw error;
//       setReviews(data || []);
//     } catch (error) {
//       console.error('Error fetching reviews:', error);
//       setError(`Error fetching reviews: ${error.message}`);
//     }
//   };

//   const addToCart = () => {
//     if (!product) return;
//     const updatedCart = [...cart, product];
//     setCart(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     alert(`${product.name} added to cart!`);
//   };

//   const addToWishlist = () => {
//     if (!product) return;
//     if (!wishlist.some(item => item.id === product.id)) {
//       const updatedWishlist = [...wishlist, product];
//       setWishlist(updatedWishlist);
//       localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
//       alert(`${product.name} added to wishlist!`);
//     } else {
//       alert(`${product.name} is already in your wishlist!`);
//     }
//   };

//   if (loading) return <div className="product-loading">Loading...</div>;
//   if (error) return <div className="product-error">{error}</div>;
//   if (!product) return <p>Product not found</p>;

//   return (
//     <div className="product-page">
//       <img 
//         src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'} 
//         alt={product.name} 
//         onError={(e) => { 
//           e.target.src = 'https://dummyimage.com/150'; 
//           console.error('Image load failed for:', product.name, 'URL:', product.images?.[0]); 
//         }}
//         style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }}
//       />
//       <h1 style={{ color: '#007bff' }}>{product.name}</h1>
//       <p style={{ color: '#666' }}>${product.price}</p>
//       <p style={{ color: '#666' }}>{product.distance_km ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` : 'Distance TBD'}</p>
//       <p style={{ color: '#666' }}>{product.description || 'No description available'}</p>
//       <div className="product-actions">
//         <button onClick={addToCart} className="action-btn">Add to Cart</button>
//         <button onClick={addToWishlist} className="action-btn">Add to Wishlist</button>
//       </div>
//       <div className="seller-details">
//         <h2 style={{ color: '#007bff' }}>Seller Information</h2>
//         <p style={{ color: '#666' }}>Store Name: {product.sellers?.store_name || 'Not available'}</p>
//         <p style={{ color: '#666' }}>Location: {product.sellers?.location ? 'Lat/Lon Set' : 'Not Set'}</p>
//         <p style={{ color: '#666' }}>Long-Distance Delivery: {product.sellers?.allows_long_distance ? 'Yes' : 'No'}</p>
//         <Link to={`/seller/${product.seller_id}`} className="view-seller-btn">View Seller Profile</Link>
//       </div>
//       <div className="reviews-section">
//         <h2 style={{ color: '#007bff' }}>Reviews</h2>
//         {reviews.length === 0 ? (
//           <p style={{ color: '#666' }}>No reviews yet.</p>
//         ) : (
//           reviews.map((review) => (
//             <div key={review.id} className="review">
//               <p style={{ color: '#666' }}><strong>{review.user_name || 'Anonymous'}</strong>: {review.rating}/5 - {review.comment}</p>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;


// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/ProductPage.css';

// function ProductPage() {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
//   const [reviews, setReviews] = useState([]);

//   // Helper function to determine a valid image URL
//   const getProductImageUrl = (product) => {
//     if (product && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
//       return product.images[0];
//     }
//     return 'https://dummyimage.com/150';
//   };

//   useEffect(() => {
//     // Detect user location
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lon: position.coords.longitude,
//           };
//           setLocation(userLocation);
//           fetchProduct(userLocation);
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//           setLocation(bengaluruLocation);
//           fetchProduct(bengaluruLocation);
//         }
//       );
//     } else {
//       const bengaluruLocation = { lat: 12.9753, lon: 77.591 }; // Default to Bengaluru
//       setLocation(bengaluruLocation);
//       fetchProduct(bengaluruLocation);
//     }

//     // Fetch reviews
//     fetchReviews();
//   }, [id]);

//   const fetchProduct = async (userLocation) => {
//     setLoading(true);
//     try {
//       if (!userLocation || !id) return;

//       // Attempt to fetch product using the RPC function
//       let { data, error: productError } = await supabase.rpc('nearby_products', {
//         user_lon: userLocation.lon,
//         user_lat: userLocation.lat,
//         max_distance_meters: 20000,
//         include_long_distance: true, // Allow long-distance products
//       }).eq('id', parseInt(id, 10));

//       if (productError) throw productError;

//       if (data && data.length > 0) {
//         setProduct(data[0]);
//       } else {
//         // Fallback: query the products table explicitly including the images column
//         const { data: fallbackData, error: fallbackError } = await supabase
//           .from('products')
//           .select('id, title, name, images, description, price, seller_id, is_approved, sellers(location, allows_long_distance, store_name)')
//           .eq('id', parseInt(id, 10))
//           .eq('is_approved', true)
//           .single();
//         if (fallbackError) throw fallbackError;
//         setProduct(fallbackData);
//       }
//     } catch (error) {
//       console.error('Error fetching product:', error);
//       setError(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReviews = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('reviews')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (error) throw error;
//       setReviews(data || []);
//     } catch (error) {
//       console.error('Error fetching reviews:', error);
//       setError(`Error fetching reviews: ${error.message}`);
//     }
//   };

//   const addToCart = () => {
//     if (!product) return;
//     const updatedCart = [...cart, product];
//     setCart(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     alert(`${product.name} added to cart!`);
//   };

//   const addToWishlist = () => {
//     if (!product) return;
//     if (!wishlist.some(item => item.id === product.id)) {
//       const updatedWishlist = [...wishlist, product];
//       setWishlist(updatedWishlist);
//       localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
//       alert(`${product.name} added to wishlist!`);
//     } else {
//       alert(`${product.name} is already in your wishlist!`);
//     }
//   };

//   if (loading) return <div className="product-loading">Loading...</div>;
//   if (error) return <div className="product-error">{error}</div>;
//   if (!product) return <p>Product not found</p>;

//   return (
//     <div className="product-page">
//       <img 
//         src={getProductImageUrl(product)} 
//         alt={product.name} 
//         onError={(e) => { 
//           e.target.src = 'https://dummyimage.com/150'; 
//           console.error('Image load failed for:', product.name, 'URL:', getProductImageUrl(product)); 
//         }}
//         style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }}
//       />
//       <h1 style={{ color: '#007bff' }}>{product.name}</h1>
//       <p style={{ color: '#666' }}>${product.price}</p>
//       <p style={{ color: '#666' }}>
//         {product.distance_km ? `${product.distance_km.toFixed(1)} km away${product.sellers?.allows_long_distance ? ' (Long-distance available)' : ''}` : 'Distance TBD'}
//       </p>
//       <p style={{ color: '#666' }}>{product.description || 'No description available'}</p>
//       <div className="product-actions">
//         <button onClick={addToCart} className="action-btn">Add to Cart</button>
//         <button onClick={addToWishlist} className="action-btn">Add to Wishlist</button>
//       </div>
//       <div className="seller-details">
//         <h2 style={{ color: '#007bff' }}>Seller Information</h2>
//         <p style={{ color: '#666' }}>Store Name: {product.sellers?.store_name || 'Not available'}</p>
//         <p style={{ color: '#666' }}>Location: {product.sellers?.location ? 'Lat/Lon Set' : 'Not Set'}</p>
//         <p style={{ color: '#666' }}>Long-Distance Delivery: {product.sellers?.allows_long_distance ? 'Yes' : 'No'}</p>
//         <Link to={`/seller/${product.seller_id}`} className="view-seller-btn">View Seller Profile</Link>
//       </div>
//       <div className="reviews-section">
//         <h2 style={{ color: '#007bff' }}>Reviews</h2>
//         {reviews.length === 0 ? (
//           <p style={{ color: '#666' }}>No reviews yet.</p>
//         ) : (
//           reviews.map((review) => (
//             <div key={review.id} className="review">
//               <p style={{ color: '#666' }}>
//                 <strong>{review.user_name || 'Anonymous'}</strong>: {review.rating}/5 - {review.comment}
//               </p>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';

// function ProductPage() {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Cart & wishlist from localStorage
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);

//   // When the page loads, fetch product + variants
//   useEffect(() => {
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     try {
//       // 1. Fetch the main product
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('id', parseInt(id, 10))
//         .single();
//       if (productError) throw productError;
//       setProduct(productData);

//       // 2. Fetch the product’s variants
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       setVariants(variantData || []);
//     } catch (err) {
//       console.error('Error fetching product or variants:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // If a variant is selected, show that variant's images
//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       // clamp the index
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   // Build a fallback images array
//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     if (activeVariant && activeVariant.images && activeVariant.images.length > 0) {
//       // Show variant images
//       return activeVariant.images;
//     } else if (product && product.images && product.images.length > 0) {
//       // Show product’s main images
//       return product.images;
//     }
//     return ['https://dummyimage.com/150'];
//   };

//   // Cart & wishlist handlers
//   const addToCart = () => {
//     if (!product) return;
//     const updatedCart = [...cart, product];
//     setCart(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     alert(`${product.title || product.name} added to cart!`);
//   };

//   const addToWishlist = () => {
//     if (!product) return;
//     if (!wishlist.some(item => item.id === product.id)) {
//       const updatedWishlist = [...wishlist, product];
//       setWishlist(updatedWishlist);
//       localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
//       alert(`${product.title || product.name} added to wishlist!`);
//     } else {
//       alert(`${product.title || product.name} is already in your wishlist!`);
//     }
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;
//   if (!product) return <div>Product not found</div>;

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   return (
//     <div className="product-page" style={{ padding: '20px' }}>
//       <h1>{product.title || product.name}</h1>
//       {/* Price: show variant price if available, else product price */}
//       <p>
//         Price: ₹
//         {activeVariant && activeVariant.price 
//           ? activeVariant.price 
//           : (product.price || 'N/A')}
//       </p>
//       {/* Stock: show variant stock if available, else product stock */}
//       <p>
//         Stock: 
//         {activeVariant && activeVariant.stock 
//           ? activeVariant.stock 
//           : (product.stock || 'N/A')}
//       </p>

//       {/* Variant selection if multiple variants */}
//       {variants.length > 0 && (
//         <div style={{ marginBottom: '20px' }}>
//           <h3>Select a Variant</h3>
//           {variants.map((v, idx) => {
//             // For example, if v.attributes = { color: "Red", size: "L" }
//             const attrText = Object.entries(v.attributes || {})
//               .map(([key, val]) => `${key}: ${val}`)
//               .join(', ');
//             return (
//               <button
//                 key={v.id}
//                 onClick={() => setSelectedVariantIndex(idx)}
//                 style={{
//                   marginRight: '10px',
//                   backgroundColor: idx === selectedVariantIndex ? '#007bff' : '#ccc',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: '5px',
//                   padding: '5px 10px',
//                   cursor: 'pointer',
//                 }}
//               >
//                 {attrText || `Variant #${idx + 1}`}
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Display images (from either the active variant or the product) */}
//       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
//         {displayedImages.map((imgUrl, i) => (
//           <img
//             key={i}
//             src={imgUrl}
//             alt={`Product Image ${i}`}
//             onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//             style={{
//               width: '150px',
//               height: '150px',
//               objectFit: 'cover',
//               borderRadius: '5px',
//             }}
//           />
//         ))}
//       </div>

//       {/* Product description */}
//       <p>{product.description || 'No description available'}</p>

//       {/* Add to Cart / Wishlist */}
//       <div style={{ margin: '20px 0' }}>
//         <button onClick={addToCart} style={{ marginRight: '10px' }}>Add to Cart</button>
//         <button onClick={addToWishlist}>Add to Wishlist</button>
//       </div>

//       {/* Seller info if needed */}
//       <p>Seller ID: {product.seller_id}</p>
//       <Link to={`/seller/${product.seller_id}`}>View Seller Profile</Link>
//     </div>
//   );
// }

// export default ProductPage;



// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { supabase } from '../supabaseClient';

// function ProductPage() {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // localStorage cart/wishlist
//   const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
//   const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);

//   useEffect(() => {
//     fetchProductAndVariants();
//   }, [id]);

//   const fetchProductAndVariants = async () => {
//     setLoading(true);
//     try {
//       // 1. Fetch product
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('*')
//         .eq('id', parseInt(id, 10))
//         .single();
//       if (productError) throw productError;
//       setProduct(productData);

//       // 2. Fetch variants
//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('*')
//         .eq('product_id', parseInt(id, 10));
//       if (variantError) throw variantError;
//       setVariants(variantData || []);
//     } catch (err) {
//       console.error('Error fetching product or variants:', err);
//       setError(`Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getActiveVariant = () => {
//     if (variants.length > 0) {
//       const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
//       return variants[clampedIndex];
//     }
//     return null;
//   };

//   const getDisplayedImages = () => {
//     const activeVariant = getActiveVariant();
//     if (activeVariant && activeVariant.images && activeVariant.images.length > 0) {
//       return activeVariant.images;
//     } else if (product && product.images && product.images.length > 0) {
//       return product.images;
//     }
//     return ['https://dummyimage.com/150'];
//   };

//   const addToCart = () => {
//     if (!product) return;
//     const updatedCart = [...cart, product];
//     setCart(updatedCart);
//     localStorage.setItem('cart', JSON.stringify(updatedCart));
//     alert(`${product.title || product.name} added to cart!`);
//   };

//   const addToWishlist = () => {
//     if (!product) return;
//     if (!wishlist.some(item => item.id === product.id)) {
//       const updatedWishlist = [...wishlist, product];
//       setWishlist(updatedWishlist);
//       localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
//       alert(`${product.title || product.name} added to wishlist!`);
//     } else {
//       alert(`${product.title || product.name} is already in your wishlist!`);
//     }
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;
//   if (!product) return <div>Product not found</div>;

//   const displayedImages = getDisplayedImages();
//   const activeVariant = getActiveVariant();

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>{product.title || product.name}</h1>
//       {/* Show variant or product price */}
//       <p>Price: ₹{activeVariant && activeVariant.price ? activeVariant.price : product.price || 'N/A'}</p>
//       {/* Show variant or product stock */}
//       <p>Stock: {activeVariant && activeVariant.stock ? activeVariant.stock : product.stock || 'N/A'}</p>

//       {/* If multiple variants, let user pick */}
//       {variants.length > 0 && (
//         <div style={{ marginBottom: '20px' }}>
//           <h3>Select a Variant</h3>
//           {variants.map((v, idx) => {
//             const attrText = Object.entries(v.attributes || {})
//               .map(([key, val]) => `${key}: ${val}`)
//               .join(', ');
//             return (
//               <button
//                 key={v.id}
//                 onClick={() => setSelectedVariantIndex(idx)}
//                 style={{
//                   marginRight: '10px',
//                   backgroundColor: idx === selectedVariantIndex ? '#007bff' : '#ccc',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: '5px',
//                   padding: '5px 10px',
//                   cursor: 'pointer',
//                 }}
//               >
//                 {attrText || `Variant #${idx + 1}`}
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Display images */}
//       <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
//         {displayedImages.map((imgUrl, i) => (
//           <img
//             key={i}
//             src={imgUrl}
//             alt={`img ${i}`}
//             onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
//             style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
//           />
//         ))}
//       </div>

//       <p>{product.description || 'No description available'}</p>

//       <button onClick={addToCart} style={{ marginRight: '10px' }}>Add to Cart</button>
//       <button onClick={addToWishlist}>Add to Wishlist</button>

//       <p>Seller ID: {product.seller_id}</p>
//     </div>
//   );
// }

// export default ProductPage;


import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Slider from "react-slick"; // Import react-slick
import { supabase } from '../supabaseClient';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Local storage for cart & wishlist
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);

  useEffect(() => {
    fetchProductAndVariants();
  }, [id]);

  const fetchProductAndVariants = async () => {
    setLoading(true);
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(id, 10))
        .single();
      if (productError) throw productError;
      setProduct(productData);

      // Fetch variants
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', parseInt(id, 10));
      if (variantError) throw variantError;
      setVariants(variantData || []);
    } catch (err) {
      console.error('Error fetching product or variants:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getActiveVariant = () => {
    if (variants.length > 0) {
      const clampedIndex = Math.min(selectedVariantIndex, variants.length - 1);
      return variants[clampedIndex];
    }
    return null;
  };

  const getDisplayedImages = () => {
    const activeVariant = getActiveVariant();
    if (activeVariant && activeVariant.images && activeVariant.images.length > 0) {
      return activeVariant.images;
    } else if (product && product.images && product.images.length > 0) {
      return product.images;
    }
    return ['https://dummyimage.com/150'];
  };

  // Slider settings - autoplay is set to false so that user slides manually.
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: false, // Explicitly disable auto slide
  };

  // Handlers for cart and wishlist actions
  const addToCart = () => {
    if (!product) return;
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert(`${product.title || product.name} added to cart!`);
  };

  const addToWishlist = () => {
    if (!product) return;
    if (!wishlist.some(item => item.id === product.id)) {
      const updatedWishlist = [...wishlist, product];
      setWishlist(updatedWishlist);
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      alert(`${product.title || product.name} added to wishlist!`);
    } else {
      alert(`${product.title || product.name} is already in your wishlist!`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!product) return <div>Product not found</div>;

  const displayedImages = getDisplayedImages();
  const activeVariant = getActiveVariant();

  return (
    <div style={{ padding: '20px' }}>
      <h1>{product.title || product.name}</h1>
      <p>
        Price: ₹{activeVariant && activeVariant.price ? activeVariant.price : product.price || 'N/A'}
      </p>
      <p>
        Stock: {activeVariant && activeVariant.stock ? activeVariant.stock : product.stock || 'N/A'}
      </p>

      {variants.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Select a Variant</h3>
          {variants.map((v, idx) => {
            const attrText = Object.entries(v.attributes || {})
              .map(([key, val]) => `${key}: ${val}`)
              .join(', ');
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVariantIndex(idx)}
                style={{
                  marginRight: '10px',
                  backgroundColor: idx === selectedVariantIndex ? '#007bff' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                {attrText || `Variant #${idx + 1}`}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        {displayedImages.length > 1 ? (
          <Slider {...sliderSettings}>
            {displayedImages.map((imgUrl, i) => (
              <div key={i}>
                <img
                  src={imgUrl}
                  alt={`Slide ${i}`}
                  onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
                  style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '5px' }}
                />
              </div>
            ))}
          </Slider>
        ) : (
          <img
            src={displayedImages[0]}
            alt="Product"
            onError={(e) => (e.target.src = 'https://dummyimage.com/150')}
            style={{ width: '100%', maxWidth: '300px', height: 'auto', objectFit: 'cover', borderRadius: '5px' }}
          />
        )}
      </div>

      <p>{product.description || 'No description available'}</p>

      <div style={{ margin: '20px 0' }}>
        <button onClick={addToCart} style={{ marginRight: '10px' }}>Add to Cart</button>
        <button onClick={addToWishlist}>Add to Wishlist</button>
      </div>

      <p>Seller ID: {product.seller_id}</p>
      <Link to={`/seller/${product.seller_id}`}>View Seller Profile</Link>
    </div>
  );
}

export default ProductPage;
