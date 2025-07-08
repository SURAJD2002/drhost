
// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// // Retry function
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc) return null;
//   const R = 6371;
//   let lat, lon;
//   if (sellerLoc.latitude !== undefined && sellerLoc.longitude !== undefined) {
//     lat = sellerLoc.latitude;
//     lon = sellerLoc.longitude;
//   } else if (sellerLoc.lat !== undefined && sellerLoc.lon !== undefined) {
//     lat = sellerLoc.lat;
//     lon = sellerLoc.lon;
//   } else if (sellerLoc.coordinates) {
//     [lon, lat] = sellerLoc.coordinates; // PostGIS [lon, lat] order
//   } else {
//     return null;
//   }
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//       Math.cos(lat * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(
//     async (userLocation) => {
//       if (!userLocation || !categoryId) return;
//       setLoading(true);
//       try {
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude, location')
//         );
//         if (sellersError) throw sellersError;
//         console.log('Sellers Data:', sellersData);

//         const nearbySellerIds = sellersData
//           .filter((seller) => {
//             const distance = calculateDistance(userLocation, seller);
//             console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
//             return distance !== null && distance <= 20;
//           })
//           .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 20km');
//           setProducts([]);
//           setLoading(false);
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, category_id, title, name, price, images, seller_id')
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         if (error) throw error;
//         console.log('Fetched Products:', data);

//         if (data) {
//           setProducts(
//             data.map((p) => ({
//               ...p,
//               name: p.title || p.name || 'Unnamed Product',
//               images: Array.isArray(p.images) ? p.images : [],
//               distance_km: calculateDistance(userLocation, sellersData.find(s => s.id === p.seller_id)),
//             }))
//           );
//         } else {
//           setProducts([]);
//         }
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [categoryId]
//   );

//   const fetchCartItems = async () => {
//     try {
//       const {
//         data: { session },
//         error: sessionError,
//       } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const stored = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(stored);
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       const fallback = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(fallback);
//       setError(`Cart error: ${error.message}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined) {
//       setError('Invalid product. Cannot add to cart.');
//       return;
//     }
//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }
//       const current = JSON.parse(localStorage.getItem('cart')) || [];
//       const found = current.find((item) => item.id === product.id);
//       if (found) {
//         found.quantity = (found.quantity || 1) + 1;
//       } else {
//         current.push({
//           id: product.id,
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(current));
//       setMessage('Item added to cart!');
//     } catch (err) {
//       console.error('Add to cart error:', err);
//       setError(`Add to cart error: ${err.message}`);
//     }
//   };

//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//           setLocation(userLoc);
//           fetchProducts(userLoc);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLoc = { lat: 12.9753, lon: 77.591 };
//           setLocation(defaultLoc);
//           fetchProducts(defaultLoc);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLoc = { lat: 12.9753, lon: 77.591 };
//       setLocation(defaultLoc);
//       fetchProducts(defaultLoc);
//       fetchCartItems();
//     }
//   }, [fetchProducts]);

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="products-page">
//       {products.length === 0 ? (
//         <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//           No products found within 20km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="page-title">FreshCart Products in Category</h1>
//           {message && <p className="message">{message}</p>}

//           <div className="product-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <img
//                   src={
//                     product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'
//                   }
//                   alt={product.name}
//                   onError={(e) => {
//                     e.target.src = 'https://dummyimage.com/150';
//                   }}
//                 />
//                 <h3 className="product-name">{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-distance">
//                   {product.distance_km
//                     ? `${product.distance_km.toFixed(1)} km away`
//                     : 'Distance TBD'}
//                 </p>
//                 <div className="product-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="modal" onClick={() => setShowProductModal(null)}>
//               <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2>{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images?.[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => {
//                     e.target.src = 'https://dummyimage.com/300';
//                   }}
//                 />
//                 <p className="modal-price">
//                   ₹
//                   {showProductModal.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="modal-distance">
//                   {showProductModal.distance_km
//                     ? `${showProductModal.distance_km.toFixed(1)} km away`
//                     : 'Distance TBD'}
//                 </p>
//                 <div className="modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                   >
//                     Buy Now
//                   </button>
//                   <button onClick={() => setShowProductModal(null)}>Close</button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       <div className="footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// // Retry function
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(
//     async (userLocation) => {
//       if (!userLocation || !categoryId) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }
//       setLoading(true);
//       try {
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw sellersError;
//         console.log('Sellers Data:', sellersData);

//         const nearbySellerIds = sellersData
//           .filter((seller) => {
//             const distance = calculateDistance(userLocation, seller);
//             console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
//             return distance !== null && distance <= 40; // Changed from 20 km to 40 km
//           })
//           .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 40km');
//           setProducts([]);
//           setLoading(false);
//           setError('No products found within 40km for this category.');
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, category_id, title, name, price, images, seller_id')
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         if (error) throw error;
//         console.log('Fetched Products:', data);

//         if (data) {
//           setProducts(
//             data.map((p) => ({
//               ...p,
//               name: p.title || p.name || 'Unnamed Product',
//               images: Array.isArray(p.images) ? p.images : [],
//               distance_km: calculateDistance(userLocation, sellersData.find((s) => s.id === p.seller_id)),
//             }))
//           );
//         } else {
//           setProducts([]);
//         }
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [categoryId]
//   );

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const stored = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(stored);
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       const fallback = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(fallback);
//       setError(`Cart error: ${error.message}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined) {
//       setError('Invalid product. Cannot add to cart.');
//       return;
//     }
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }
//       const current = JSON.parse(localStorage.getItem('cart')) || [];
//       const found = current.find((item) => item.id === product.id);
//       if (found) {
//         found.quantity = (found.quantity || 1) + 1;
//       } else {
//         current.push({
//           id: product.id,
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(current));
//       setMessage('Item added to cart!');
//       setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
//     } catch (err) {
//       console.error('Add to cart error:', err);
//       setError(`Add to cart error: ${err.message}`);
//     }
//   };

//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//           setLocation(userLoc);
//           fetchProducts(userLoc);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//           setLocation(defaultLoc);
//           fetchProducts(defaultLoc);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//       setLocation(defaultLoc);
//       fetchProducts(defaultLoc);
//       fetchCartItems();
//     }
//   }, [fetchProducts]);

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error) return <div className="error" style={{ color: 'red' }}>{error}</div>;

//   return (
//     <div className="products-page">
//       {products.length === 0 ? (
//         <div className="no-products" style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="page-title">FreshCart Products in Category</h1>
//           {message && <p className="message" style={{ color: 'green' }}>{message}</p>}

//           <div className="product-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <img
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3 className="product-name">{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-distance">
//                   {product.distance_km
//                     ? `${product.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="product-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="modal" onClick={() => setShowProductModal(null)}>
//               <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2>{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images?.[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <p className="modal-price">
//                   ₹{showProductModal.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="modal-distance">
//                   {showProductModal.distance_km
//                     ? `${showProductModal.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                   >
//                     Buy Now
//                   </button>
//                   <button onClick={() => setShowProductModal(null)}>Close</button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       <div className="footer">
//         <div className="footer-icons">
//           <span className="icon-circle">🏠</span>
//           <span className="icon-circle">🛒</span>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';

// // Retry function
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(
//     async (userLocation) => {
//       if (!userLocation || !categoryId) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw sellersError;
//         console.log('Sellers Data:', sellersData);

//         const nearbySellerIds = sellersData
//           .filter((seller) => {
//             const distance = calculateDistance(userLocation, seller);
//             console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
//             return distance !== null && distance <= 40;
//           })
//           .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 40km');
//           setProducts([]);
//           setLoading(false);
//           setError('No products found within 40km for this category.');
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, category_id, title, name, price, images, seller_id')
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         if (error) throw error;
//         console.log('Fetched Products:', data);

//         if (data) {
//           setProducts(
//             data.map((p) => ({
//               ...p,
//               name: p.title || p.name || 'Unnamed Product',
//               images: Array.isArray(p.images) ? p.images : [],
//               distance_km: calculateDistance(userLocation, sellersData.find((s) => s.id === p.seller_id)),
//             }))
//           );
//         } else {
//           setProducts([]);
//         }
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [categoryId]
//   );

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const stored = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(stored);
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       const fallback = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(fallback);
//       setError(`Cart error: ${error.message}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined) {
//       setError('Invalid product. Cannot add to cart.');
//       return;
//     }
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }
//       const current = JSON.parse(localStorage.getItem('cart')) || [];
//       const found = current.find((item) => item.id === product.id);
//       if (found) {
//         found.quantity = (found.quantity || 1) + 1;
//       } else {
//         current.push({
//           id: product.id,
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(current));
//       setCartItems(current);
//       setMessage('Item added to cart!');
//       setTimeout(() => setMessage(''), 3000);
//     } catch (err) {
//       console.error('Add to cart error:', err);
//       setError(`Add to cart error: ${err.message}`);
//     }
//   };

//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//           setLocation(userLoc);
//           fetchProducts(userLoc);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//           setLocation(defaultLoc);
//           fetchProducts(defaultLoc);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//       setLocation(defaultLoc);
//       fetchProducts(defaultLoc);
//       fetchCartItems();
//     }
//   }, [fetchProducts]);

//   if (loading) return (
//     <div className="loading">
//       <svg className="spinner" viewBox="0 0 50 50">
//         <circle className="path" cx="25" cy="25" r="20" fill="証" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="error">
//       {error}
//       <div className="error-actions">
//         <button onClick={() => fetchProducts(location)} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="products-page">
//       {products.length === 0 ? (
//         <div className="no-products">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="page-title">Products in Category</h1>
//           {message && <p className="message">{message}</p>}

//           <div className="product-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <img
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3 className="product-name">{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-distance">
//                   {product.distance_km
//                     ? `${product.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="product-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="modal" onClick={() => setShowProductModal(null)}>
//               <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="modal-title">{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images?.[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <p className="modal-price">
//                   ₹{showProductModal.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="modal-distance">
//                   {showProductModal.distance_km
//                     ? `${showProductModal.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="modal-add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="modal-buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                   <button
//                     onClick={() => setShowProductModal(null)}
//                     className="modal-close-btn"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       <div className="footer">
//         <div className="footer-icons">
//           <Link to="/" className="icon-circle">🏠</Link>
//           <Link to="/cart" className="icon-circle">🛒</Link>
//         </div>
//         <p className="footer-text">Categories</p>
//       </div>
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';
// import Footer from './Footer'; // Import Footer component

// // Retry function
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(
//     async (userLocation) => {
//       if (!userLocation || !categoryId) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw sellersError;
//         console.log('Sellers Data:', sellersData);

//         const nearbySellerIds = sellersData
//           .filter((seller) => {
//             const distance = calculateDistance(userLocation, seller);
//             console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
//             return distance !== null && distance <= 40;
//           })
//           .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 40km');
//           setProducts([]);
//           setLoading(false);
//           setError('No products found within 40km for this category.');
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, category_id, title, name, price, images, seller_id')
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         if (error) throw error;
//         console.log('Fetched Products:', data);

//         if (data) {
//           setProducts(
//             data.map((p) => ({
//               ...p,
//               name: p.title || p.name || 'Unnamed Product',
//               images: Array.isArray(p.images) ? p.images : [],
//               distance_km: calculateDistance(userLocation, sellersData.find((s) => s.id === p.seller_id)),
//             }))
//           );
//         } else {
//           setProducts([]);
//         }
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [categoryId]
//   );

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const stored = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(stored);
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       const fallback = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(fallback);
//       setError(`Cart error: ${error.message}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined) {
//       setError('Invalid product. Cannot add to cart.');
//       return;
//     }
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }
//       const current = JSON.parse(localStorage.getItem('cart')) || [];
//       const found = current.find((item) => item.id === product.id);
//       if (found) {
//         found.quantity = (found.quantity || 1) + 1;
//       } else {
//         current.push({
//           id: product.id,
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(current));
//       setCartItems(current);
//       setMessage('Item added to cart!');
//       setTimeout(() => setMessage(''), 3000);
//     } catch (err) {
//       console.error('Add to cart error:', err);
//       setError(`Add to cart error: ${err.message}`);
//     }
//   };

//   const handleBuyNow = (product) => {
//     navigate('/cart', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//           setLocation(userLoc);
//           fetchProducts(userLoc);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//           setLocation(defaultLoc);
//           fetchProducts(defaultLoc);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//       setLocation(defaultLoc);
//       fetchProducts(defaultLoc);
//       fetchCartItems();
//     }
//   }, [fetchProducts]);

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
//         <button onClick={() => fetchProducts(location)} className="retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="products-page">
//       {products.length === 0 ? (
//         <div className="no-products">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="page-title">Products in Category</h1>
//           {message && <p className="message">{message}</p>}

//           <div className="product-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="product-card"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <img
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3 className="product-name">{product.name}</h3>
//                 <p className="product-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="product-distance">
//                   {product.distance_km
//                     ? `${product.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="product-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="modal" onClick={() => setShowProductModal(null)}>
//               <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="modal-title">{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images?.[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <p className="modal-price">
//                   ₹{showProductModal.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <p className="modal-distance">
//                   {showProductModal.distance_km
//                     ? `${showProductModal.distance_km.toFixed(1)} km away`
//                     : 'Distance unavailable'}
//                 </p>
//                 <div className="modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="modal-add-to-cart-btn"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="modal-buy-now-btn"
//                   >
//                     Buy Now
//                   </button>
//                   <button
//                     onClick={() => setShowProductModal(null)}
//                     className="modal-close-btn"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       <Footer /> {/* Use Footer component instead of inline footer */}
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import '../style/Products.css';
// import Footer from './Footer';

// // Retry function
// async function retryRequest(fn, maxAttempts = 3, initialDelay = 1000) {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxAttempts) throw error;
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// }

// // Distance calculation (still needed for logic, but not displayed)
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// function Products() {
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState('');
//   const [cartItems, setCartItems] = useState([]);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(
//     async (userLocation) => {
//       if (!userLocation || !categoryId) {
//         setProducts([]);
//         setLoading(false);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         const { data: sellersData, error: sellersError } = await retryRequest(() =>
//           supabase.from('sellers').select('id, latitude, longitude')
//         );
//         if (sellersError) throw sellersError;
//         console.log('Sellers Data:', sellersData);

//         const nearbySellerIds = sellersData
//           .filter((seller) => {
//             const distance = calculateDistance(userLocation, seller);
//             console.log(`Seller ${seller.id} Distance: ${distance !== null ? distance.toFixed(2) : 'N/A'} km`);
//             return distance !== null && distance <= 40;
//           })
//           .map((seller) => seller.id);
//         console.log('Nearby Seller IDs:', nearbySellerIds);

//         if (nearbySellerIds.length === 0) {
//           console.log('No sellers within 40km');
//           setProducts([]);
//           setLoading(false);
//           setError('No products found within 40km for this category.');
//           return;
//         }

//         const { data, error } = await retryRequest(() =>
//           supabase
//             .from('products')
//             .select('id, category_id, title, name, price, images, seller_id')
//             .eq('category_id', parseInt(categoryId, 10))
//             .eq('is_approved', true)
//             .in('seller_id', nearbySellerIds)
//         );
//         if (error) throw error;
//         console.log('Fetched Products:', data);

//         if (data) {
//           setProducts(
//             data.map((p) => ({
//               ...p,
//               name: p.title || p.name || 'Unnamed Product',
//               images: Array.isArray(p.images) ? p.images : [],
//               distance_km: calculateDistance(userLocation, sellersData.find((s) => s.id === p.seller_id)),
//             }))
//           );
//         } else {
//           setProducts([]);
//         }
//       } catch (err) {
//         console.error('Error fetching products:', err);
//         setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [categoryId]
//   );

//   const fetchCartItems = async () => {
//     try {
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//       if (sessionError || !session?.user) {
//         const stored = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(stored);
//         return;
//       }
//       const userId = session.user.id;
//       const { data, error } = await supabase.from('cart').select('*').eq('user_id', userId);
//       if (error) {
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         setCartItems(storedCart);
//       } else {
//         setCartItems(data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching cart:', error);
//       const fallback = JSON.parse(localStorage.getItem('cart')) || [];
//       setCartItems(fallback);
//       setError(`Cart error: ${error.message}`);
//     }
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined) {
//       setError('Invalid product. Cannot add to cart.');
//       return;
//     }
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.user) {
//         setError('Authentication required. Please log in.');
//         return;
//       }
//       const current = JSON.parse(localStorage.getItem('cart')) || [];
//       const found = current.find((item) => item.id === product.id);
//       if (found) {
//         found.quantity = (found.quantity || 1) + 1;
//       } else {
//         current.push({
//           id: product.id,
//           title: product.title || product.name,
//           price: product.price,
//           quantity: 1,
//         });
//       }
//       localStorage.setItem('cart', JSON.stringify(current));
//       setCartItems(current);
//       setMessage('Item added to cart!');
//       setTimeout(() => setMessage(''), 3000);
//     } catch (err) {
//       console.error('Add to cart error:', err);
//       setError(`Add to cart error: ${err.message}`);
//     }
//   };

//   const handleBuyNow = (product) => {
//     navigate('/checkout', { state: { product } }); // Navigate directly to checkout
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           const userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
//           setLocation(userLoc);
//           fetchProducts(userLoc);
//           fetchCartItems();
//         },
//         (geoError) => {
//           console.error('Geolocation error:', geoError);
//           const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//           setLocation(defaultLoc);
//           fetchProducts(defaultLoc);
//           fetchCartItems();
//         },
//         { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//       setLocation(defaultLoc);
//       fetchProducts(defaultLoc);
//       fetchCartItems();
//     }
//   }, [fetchProducts]);

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts(location)} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">Products in Category</h1>
//           {message && <p className="prod-message">{message}</p>}

//           <div className="prod-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="prod-item"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <img
//                   src={product.images?.[0] ? product.images[0] : 'https://dummyimage.com/150'}
//                   alt={product.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                 />
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <p className="prod-item-price">
//                   ₹{product.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 {/* Removed distance display */}
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now"
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="prod-modal" onClick={() => setShowProductModal(null)}>
//               <div className="prod-modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="prod-modal-title">{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images?.[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <p className="prod-modal-price">
//                   ₹{showProductModal.price.toLocaleString('en-IN', {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 {/* Removed distance display */}
//                 <div className="prod-modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-add-cart"
//                   >
//                     Add to Cart
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-buy-now"
//                   >
//                     Buy Now
//                   </button>
//                   <button
//                     onClick={() => setShowProductModal(null)}
//                     className="prod-modal-close"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;


// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Products.css';
// import Footer from './Footer';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       position: "top-center",
//       autoClose: 3000,
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       // Fetch sellers with valid latitude and longitude
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Filter sellers within 40km
//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoading(false);
//         return;
//       }

//       // Fetch products for the category from nearby sellers
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       // Map products to a standardized format
//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to add items to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.warn('Exceeds stock.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to checkout.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.warn(errorMessage, {
//               position: "top-center",
//               autoClose: 3000,
//             });
//             // Fallback to default location
//             const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts]);

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <ToastContainer position="top-center" autoClose={3000} />
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">Products in Category</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="prod-item"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                 </div>
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <div className="price-section">
//                   <p className="prod-item-price">
//                     ₹{product.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {product.originalPrice && product.originalPrice > product.price && (
//                     <p className="original-price">
//                       ₹{product.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="prod-modal" onClick={() => setShowProductModal(null)}>
//               <div className="prod-modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="prod-modal-title">{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <div className="price-section">
//                   <p className="prod-modal-price">
//                     ₹{showProductModal.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {showProductModal.originalPrice && showProductModal.originalPrice > showProductModal.price && (
//                     <p className="original-price">
//                       ₹{showProductModal.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-add-cart"
//                     disabled={showProductModal.stock <= 0}
//                   >
//                     {showProductModal.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-buy-now"
//                     disabled={showProductModal.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                   <button
//                     onClick={() => setShowProductModal(null)}
//                     className="prod-modal-close"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Products.css';
// import Footer from './Footer';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       position: "top-center",
//       autoClose: 3000,
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showProductModal, setShowProductModal] = useState(null);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       // Fetch sellers with valid latitude and longitude
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Filter sellers within 40km
//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoading(false);
//         return;
//       }

//       // Fetch products for the category from nearby sellers
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       // Map products to a standardized format
//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to add items to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.warn('Exceeds stock.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }

//       // Fetch updated cart count and update context
//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to checkout.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   const handleProductClick = (product) => {
//     setShowProductModal(product);
//   };

//   useEffect(() => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.warn(errorMessage, {
//               position: "top-center",
//               autoClose: 3000,
//             });
//             // Fallback to default location
//             const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts]);

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <ToastContainer position="top-center" autoClose={3000} />
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">Products in Category</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="prod-item"
//                 onClick={() => handleProductClick(product)}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                 </div>
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <div className="price-section">
//                   <p className="prod-item-price">
//                     ₹{product.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {product.originalPrice && product.originalPrice > product.price && (
//                     <p className="original-price">
//                       ₹{product.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {showProductModal && (
//             <div className="prod-modal" onClick={() => setShowProductModal(null)}>
//               <div className="prod-modal-content" onClick={(e) => e.stopPropagation()}>
//                 <h2 className="prod-modal-title">{showProductModal.name}</h2>
//                 <img
//                   src={
//                     showProductModal.images[0]
//                       ? showProductModal.images[0]
//                       : 'https://dummyimage.com/300'
//                   }
//                   alt={showProductModal.name}
//                   onError={(e) => { e.target.src = 'https://dummyimage.com/300'; }}
//                 />
//                 <div className="price-section">
//                   <p className="prod-modal-price">
//                     ₹{showProductModal.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {showProductModal.originalPrice && showProductModal.originalPrice > showProductModal.price && (
//                     <p className="original-price">
//                       ₹{showProductModal.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-modal-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-add-cart"
//                     disabled={showProductModal.stock <= 0}
//                   >
//                     {showProductModal.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(showProductModal);
//                       setShowProductModal(null);
//                     }}
//                     className="prod-modal-buy-now"
//                     disabled={showProductModal.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                   <button
//                     onClick={() => setShowProductModal(null)}
//                     className="prod-modal-close"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;




// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Products.css';
// import Footer from './Footer';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371; // Earth's radius in kilometers
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       position: "top-center",
//       autoClose: 3000,
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       // Fetch sellers with valid latitude and longitude
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       // Filter sellers within 40km
//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoading(false);
//         return;
//       }

//       // Fetch products for the category from nearby sellers
//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       // Map products to a standardized format
//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to add items to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.warn('Exceeds stock.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }

//       // Fetch updated cart count and update context
//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to checkout.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   useEffect(() => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.warn(errorMessage, {
//               position: "top-center",
//               autoClose: 3000,
//             });
//             // Fallback to default location
//             const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         const defaultLoc = { lat: 12.9753, lon: 77.591 }; // Bangalore, India
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts]);

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <ToastContainer position="top-center" autoClose={3000} />
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">Products in Category</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <Link
//                 to={`/product/${product.id}`}
//                 key={product.id}
//                 className="prod-item"
//                 style={{ textDecoration: 'none' }}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                 </div>
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <div className="price-section">
//                   <p className="prod-item-price">
//                     ₹{product.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {product.originalPrice && product.originalPrice > product.price && (
//                     <p className="original-price">
//                       ₹{product.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       position: "top-center",
//       autoClose: 3000,
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) return;
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.warn('No buyer location available. Please allow location access.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id, // Fixed typo
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error('Failed to fetch products.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to add items to cart.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.warn('Exceeds stock.', {
//             position: "top-center",
//             autoClose: 3000,
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
//           position: "top-center",
//           autoClose: 3000,
//         });
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.warn('Please log in to proceed to checkout.', {
//         position: "top-center",
//         autoClose: 3000,
//       });
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.warn(errorMessage, {
//               position: "top-center",
//               autoClose: 3000,
//             });
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           position: "top-center",
//           autoClose: 3000,
//         });
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.';
//   const pageUrl = categoryId ? `https://www.markeet.com/products?category=${categoryId}` : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     "@type": "ListItem",
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "ItemList",
//             itemListElement: productList,
//           })}
//         </script>
//       </Helmet>
//       <ToastContainer position="top-center" autoClose={3000} />
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <Link
//                 to={`/product/${product.id}`}
//                 key={product.id}
//                 className="prod-item"
//                 style={{ textDecoration: 'none' }}
//               >
//                 <div className="product-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={`${product.name} product image`}
//                     onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                   />
//                 </div>
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <div className="price-section">
//                   <p className="prod-item-price">
//                     ₹{product.price.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {product.originalPrice && product.originalPrice > product.price && (
//                     <p className="original-price">
//                       ₹{product.originalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { Toaster, toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) return;
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
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
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           duration: 4000,
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
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
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
//       } else {
//         toast.error('Failed to fetch products.', {
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
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
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
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
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
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
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
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
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
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
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
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
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
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.';
//   const pageUrl = categoryId ? `https://www.markeet.com/products?category=${categoryId}` : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     "@type": "ListItem",
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "ItemList",
//             itemListElement: productList,
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
//         }}
//       />
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div key={product.id} className="prod-item">
//                 <Link
//                   to={`/product/${product.id}`}
//                   style={{ textDecoration: 'none' }}
//                   className="prod-item-link"
//                 >
//                   <div className="product-image-wrapper">
//                     {product.discountAmount > 0 && (
//                       <span className="offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save ₹{product.discountAmount.toFixed(2)}
//                       </span>
//                     )}
//                     <img
//                       src={product.images[0]}
//                       alt={`${product.name} product image`}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="prod-item-price">
//                       ₹{product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                 </Link>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={() => addToCart(product)}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={() => handleBuyNow(product)}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;

// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast'; // Removed Toaster import
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (!userLoc || !sellerLoc || !sellerLoc.latitude || !sellerLoc.longitude || sellerLoc.latitude === 0 || sellerLoc.longitude === 0) return null;
//   const R = 6371;
//   const lat = sellerLoc.latitude;
//   const lon = sellerLoc.longitude;
//   const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
//   const dLon = ((lon - userLoc.lon) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(userLoc.lat * (Math.PI / 180)) *
//     Math.cos(lat * (Math.PI / 180)) *
//     Math.sin(dLon / 2) ** 2;
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) return;
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//     }
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
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
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const nearbySellerIds = sellersData
//         .filter((seller) => {
//           const distance = calculateDistance(buyerLocation, { latitude: seller.latitude, longitude: seller.longitude });
//           return distance !== null && distance <= 40;
//         })
//         .map((seller) => seller.id);

//       if (nearbySellerIds.length === 0) {
//         setProducts([]);
//         toast.info('No sellers nearby within 40km for this category.', {
//           duration: 4000,
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
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .in('seller_id', nearbySellerIds);
//       if (error) throw error;

//       const mappedProducts = data.map((product) => ({
//         id: product.id,
//         name: product.title || product.name || 'Unnamed Product',
//         images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//         price: parseFloat(product.price) || 0,
//         originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//         discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//         stock: product.stock || 0,
//         seller_id: product.seller_id,
//       }));

//       setProducts(mappedProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while fetching products. Please check your connection.', {
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
//       } else {
//         toast.error('Failed to fetch products.', {
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
//       }
//       setProducts([]);
//       setError(`Error: ${err.message || 'Failed to fetch products.'}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
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
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       if (err.message.includes('Network')) {
//         toast.error('Network error while adding to cart. Please check your connection.', {
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
//       } else {
//         toast.error(`Failed to add to cart: ${err.message || 'Unknown error'}`, {
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
//       }
//     }
//   };

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
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
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation || !buyerLocation.lat || !buyerLocation.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
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
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
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
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.';
//   const pageUrl = categoryId ? `https://www.markeet.com/products?category=${categoryId}` : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     "@type": "ListItem",
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) return (
//     <div className="prod-loading">
//       <svg className="prod-spinner" viewBox="0 0 50 50">
//         <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//       </svg>
//       Loading...
//     </div>
//   );

//   if (error) return (
//     <div className="prod-error">
//       {error}
//       <div className="prod-error-actions">
//         <button onClick={() => fetchProducts()} className="prod-retry-btn">Retry</button>
//         <button onClick={() => navigate('/')} className="prod-back-btn">Back to Home</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="prod-page">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "ItemList",
//             itemListElement: productList,
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within 40km for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div key={product.id} className="prod-item">
//                 <Link
//                   to={`/product/${product.id}`}
//                   style={{ textDecoration: 'none' }}
//                   className="prod-item-link"
//                 >
//                   <div className="product-image-wrapper">
//                     {product.discountAmount > 0 && (
//                       <span className="offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save ₹{product.discountAmount.toFixed(2)}
//                       </span>
//                     )}
//                     <img
//                       src={product.images[0]}
//                       alt={`${product.name} product image`}
//                       onError={(e) => { e.target.src = 'https://dummyimage.com/150'; }}
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="prod-item-price">
//                       ₹{product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                 </Link>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={() => addToCart(product)}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={() => handleBuyNow(product)}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
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
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) return;
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//       toast.error('Failed to fetch category details.', {
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
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
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
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select('id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock, delivery_radius_km, categories (max_delivery_radius_km)')
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       const nearbyProducts = productsData
//         .filter((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance !== null && distance <= effectiveRadius;
//         })
//         .map((product) => ({
//           id: product.id,
//           name: product.title || product.name || 'Unnamed Product',
//           images: product.images && product.images.length > 0 ? product.images : ['https://dummyimage.com/150'],
//           price: parseFloat(product.price) || 0,
//           originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//           discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//           stock: product.stock || 0,
//           seller_id: product.seller_id,
//           deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//         }));

//       if (nearbyProducts.length === 0) {
//         toast.info(`No ${categoryName || 'products'} found within delivery radius for this category.`, {
//           duration: 4000,
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
//       }

//       setProducts(nearbyProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while fetching products. Please check your connection.'
//         : `Failed to fetch products: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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
//       setProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
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
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     // Validate delivery radius
//     try {
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', product.seller_id)
//         .single();
//       if (sellerError || !sellerData) {
//         toast.error('Seller location not found.', {
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
//         return;
//       }
//       const distance = calculateDistance(buyerLocation, {
//         latitude: sellerData.latitude,
//         longitude: sellerData.longitude,
//       });
//       const effectiveRadius = product.deliveryRadius || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(`Product is not available in your area (${distance?.toFixed(2)}km > ${effectiveRadius}km).`, {
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
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .eq('variant_id', null) // Assuming no variants for simplicity
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//             variant_id: null, // Assuming no variants for simplicity
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while adding to cart. Please check your connection.'
//         : `Failed to add to cart: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
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
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product: { ...product, deliveryRadius: product.deliveryRadius || 40 } } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
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
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
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
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.';
//   const pageUrl = categoryId ? `https://www.markeet.com/products?category=${categoryId}` : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     '@type': 'ListItem',
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading)
//     return (
//       <div className="prod-loading">
//         <svg className="prod-spinner" viewBox="0 0 50 50">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );

//   if (error)
//     return (
//       <div className="prod-error">
//         {error}
//         <div className="prod-error-actions">
//           <button onClick={() => fetchProducts()} className="prod-retry-btn">
//             Retry
//           </button>
//           <button onClick={() => navigate('/')} className="prod-back-btn">
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );

//   return (
//     <div className="prod-page">
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || 'https://dummyimage.com/150'} />
//         <script type="application/ld+json">{JSON.stringify({
//           '@context': 'https://schema.org',
//           '@type': 'ItemList',
//           itemListElement: productList,
//         })}</script>
//       </Helmet>
//       {products.length === 0 ? (
//         <div className="prod-no-items">
//           No products found within delivery radius for this category.
//         </div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div key={product.id} className="prod-item">
//                 <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }} className="prod-item-link">
//                   <div className="product-image-wrapper">
//                     {product.discountAmount > 0 && (
//                       <span className="offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save ₹{product.discountAmount.toFixed(2)}
//                       </span>
//                     )}
//                     <img
//                       src={product.images[0]}
//                       alt={`${product.name} product image`}
//                       onError={(e) => {
//                         e.target.src = 'https://dummyimage.com/150';
//                       }}
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="prod-item-price">
//                       ₹{product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   {/* Optional: Display delivery radius */}
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                 </Link>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={() => addToCart(product)}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={() => handleBuyNow(product)}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Default placeholder image
// const DEFAULT_IMAGE = 'https://via.placeholder.com/150';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
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
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) return;
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//       toast.error('Failed to fetch category details.', {
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
//   }, [categoryId]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
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
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       setError('No category specified.');
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(
//           'id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock, delivery_radius_km, categories (max_delivery_radius_km)'
//         )
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       // Log raw productsData for debugging
//       console.log('Raw productsData:', productsData);

//       const nearbyProducts = productsData
//         .filter((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance !== null && distance <= effectiveRadius;
//         })
//         .map((product) => {
//           // Validate and sanitize images
//           const validImages = Array.isArray(product.images)
//             ? product.images
//                 .filter((img) => typeof img === 'string' && img.trim() && !img.includes('via.placeholder.com'))
//                 .map((img) => img.trim())
//             : [];
//           if (validImages.length === 0) {
//             console.warn(`Invalid or empty images for product ${product.id}:`, product.images);
//           }

//           return {
//             id: product.id,
//             name: product.title || product.name || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             seller_id: product.seller_id,
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//           };
//         });

//       if (nearbyProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category.`, {
//           duration: 4000,
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
//       }

//       setProducts(nearbyProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while fetching products. Please check your connection.'
//         : `Failed to fetch products: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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
//       setProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
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
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', product.seller_id)
//         .single();
//       if (sellerError || !sellerData) {
//         toast.error('Seller location not found.', {
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
//         return;
//       }
//       const distance = calculateDistance(buyerLocation, {
//         latitude: sellerData.latitude,
//         longitude: sellerData.longitude,
//       });
//       const effectiveRadius = product.deliveryRadius || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(`Product is not available in your area (${distance?.toFixed(2)}km > ${effectiveRadius}km).`, {
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
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .eq('variant_id', null)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//             variant_id: null,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while adding to cart. Please check your connection.'
//         : `Failed to add to cart: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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

//   const handleBuyNow = (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
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
//       navigate('/auth');
//       return;
//     }
//     navigate('/checkout', { state: { product: { ...product, deliveryRadius: product.deliveryRadius || 40 } } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
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
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
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
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, and more with fast local delivery.';
//   const pageUrl = categoryId
//     ? `https://www.markeet.com/products?category=${categoryId}`
//     : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     '@type': 'ListItem',
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) {
//     return (
//       <div className="prod-loading">
//         <svg className="prod-spinner" viewBox="0 0 50 50">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="prod-error">
//         {error}
//         <div className="prod-error-actions">
//           <button onClick={() => fetchProducts()} className="prod-retry-btn">
//             Retry
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
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: productList,
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 ? (
//         <div className="prod-no-items">No products found within delivery radius for this category.</div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div key={product.id} className="prod-item">
//                 <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }} className="prod-item-link">
//                   <div className="product-image-wrapper">
//                     {product.discountAmount > 0 && (
//                       <span className="offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save ₹{product.discountAmount.toFixed(2)}
//                       </span>
//                     )}
//                     <img
//                       src={product.images[0]}
//                       alt={`${product.name} product image`}
//                       onError={(e) => {
//                         console.warn(`Image failed to load for product ${product.id}: ${product.images[0]}`);
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="prod-item-price">
//                       ₹{product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                 </Link>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={() => addToCart(product)}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={() => handleBuyNow(product)}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;



// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Default placeholder image
// const DEFAULT_IMAGE = 'https://via.placeholder.com/150';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
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
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const location = useLocation();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) {
//       toast.error('Please select a category to view products.', {
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
//       setError('Please select a category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return;
//     }
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km, is_restricted')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       console.log('Category data:', data); // Debug log
//       if (data?.is_restricted && !location.state?.fromCategories) {
//         toast.error(`Please select the ${data.name} category from the categories page to view products.`, {
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
//         setError(`Please select the ${data.name} category to view products.`);
//         setProducts([]);
//         setLoading(false);
//         navigate('/categories');
//         return;
//       }
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//       toast.error('Failed to fetch category details.', {
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
//       setError('Failed to fetch category details.');
//     }
//   }, [categoryId, navigate, location.state]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
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
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       toast.error('Please select a category to view products.', {
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
//       setError('Please select a category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(
//           'id, category_id, title, name, price, original_price, discount_amount, images, seller_id, stock, delivery_radius_km, categories (max_delivery_radius_km, is_restricted)'
//         )
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       console.log('Raw productsData for category', categoryId, ':', productsData); // Debug log

//       const nearbyProducts = productsData
//         .filter((product) => {
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance !== null && distance <= effectiveRadius;
//         })
//         .map((product) => {
//           const validImages = Array.isArray(product.images)
//             ? product.images
//                 .filter((img) => typeof img === 'string' && img.trim() && !img.includes('via.placeholder.com'))
//                 .map((img) => img.trim())
//             : [];
//           if (validImages.length === 0) {
//             console.warn(`Invalid or empty images for product ${product.id}:`, product.images);
//           }

//           return {
//             id: product.id,
//             name: product.title || product.name || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             seller_id: product.seller_id,
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//             category_id: product.category_id, // Added for addToCart validation
//           };
//         });

//       if (nearbyProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category.`, {
//           duration: 4000,
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
//       }

//       setProducts(nearbyProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while fetching products. Please check your connection.'
//         : `Failed to fetch products: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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
//       setProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName, navigate]);

//   const addToCart = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
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
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       // Verify category is not restricted
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('is_restricted')
//         .eq('id', product.category_id)
//         .single();
//       if (categoryError) throw categoryError;
//       if (categoryData?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page to add products to cart.', {
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

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('latitude, longitude')
//         .eq('id', product.seller_id)
//         .single();
//       if (sellerError || !sellerData) {
//         toast.error('Seller location not found.', {
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
//         return;
//       }
//       const distance = calculateDistance(buyerLocation, {
//         latitude: sellerData.latitude,
//         longitude: sellerData.longitude,
//       });
//       const effectiveRadius = product.deliveryRadius || 40;
//       if (distance === null || distance > effectiveRadius) {
//         toast.error(`Product is not available in your area (${distance?.toFixed(2)}km > ${effectiveRadius}km).`, {
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
//         return;
//       }

//       const { data: existingCartItem, error: fetchError } = await supabase
//         .from('cart')
//         .select('id, quantity')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id)
//         .eq('variant_id', null)
//         .maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         throw fetchError;
//       }

//       if (existingCartItem) {
//         const newQuantity = (existingCartItem.quantity || 0) + 1;
//         if (newQuantity > product.stock) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) throw updateError;
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       } else {
//         const { error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             quantity: 1,
//             price: product.price,
//             title: product.name,
//             variant_id: null,
//           });
//         if (insertError) throw insertError;
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
//           },
//         });
//       }

//       const { data: cartData, error: cartError } = await supabase
//         .from('cart')
//         .select('*', { count: 'exact' })
//         .eq('user_id', session.user.id);
//       if (cartError) throw cartError;
//       setCartCount(cartData.length);
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while adding to cart. Please check your connection.'
//         : `Failed to add to cart: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
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

//   const handleBuyNow = async (product) => {
//     if (!product || !product.id || product.price === undefined || product.stock <= 0) {
//       toast.error(product.stock <= 0 ? 'Out of stock.' : 'Invalid product.', {
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
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
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
//       navigate('/auth');
//       return;
//     }
//     try {
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('is_restricted')
//         .eq('id', product.category_id)
//         .single();
//       if (categoryError) throw categoryError;
//       if (categoryData?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page to proceed to checkout.', {
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
//     } catch (err) {
//       console.error('Error checking category restriction:', err);
//       toast.error('Failed to verify category. Please try again.', {
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
//     navigate('/checkout', { state: { product: { ...product, deliveryRadius: product.deliveryRadius || 40 } } });
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
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
//             const defaultLoc = { lat: 12.9753, lon: 77.591 };
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
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
//         const defaultLoc = { lat: 12.9753, lon: 77.591 };
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [buyerLocation, setBuyerLocation, fetchProducts, fetchCategoryName]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.';
//   const pageUrl = categoryId
//     ? `https://www.markeet.com/products?category=${categoryId}`
//     : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     '@type': 'ListItem',
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) {
//     return (
//       <div className="prod-loading">
//         <svg className="prod-spinner" viewBox="0 0 50 50">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="prod-error">
//         {error}
//         <div className="prod-error-actions">
//           <button onClick={() => navigate('/categories')} className="prod-retry-btn">
//             Select a Category
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
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, groceries, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: productList,
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 ? (
//         <div className="prod-no-items">No products found within delivery radius for this category.</div>
//       ) : (
//         <>
//           <h1 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h1>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div key={product.id} className="prod-item">
//                 <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }} className="prod-item-link">
//                   <div className="product-image-wrapper">
//                     {product.discountAmount > 0 && (
//                       <span className="offer-badge">
//                         <span className="offer-label">Offer!</span>
//                         Save ₹{product.discountAmount.toFixed(2)}
//                       </span>
//                     )}
//                     <img
//                       src={product.images[0]}
//                       alt={product.name}
//                       onError={(e) => {
//                         console.warn(`Image failed to load for product ${product.id}: ${product.images[0]}`);
//                         e.target.src = DEFAULT_IMAGE;
//                       }}
//                     />
//                   </div>
//                   <h3 className="prod-item-name">{product.name}</h3>
//                   <div className="price-section">
//                     <p className="prod-item-price">
//                       ₹{product.price.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                     {product.originalPrice && product.originalPrice > product.price && (
//                       <p className="original-price">
//                         ₹{product.originalPrice.toLocaleString('en-IN', {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                 </Link>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={() => addToCart(product)}
//                     className="prod-add-cart"
//                     disabled={product.stock <= 0}
//                   >
//                     {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={() => handleBuyNow(product)}
//                     className="prod-buy-now"
//                     disabled={product.stock <= 0}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default Products;

// import React, { useState, useEffect, useCallback, useContext } from 'react';
// import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { LocationContext } from '../App';
// import { toast } from 'react-hot-toast';
// import '../style/Products.css';
// import Footer from './Footer';
// import { Helmet } from 'react-helmet-async';

// // Default placeholder image
// const DEFAULT_IMAGE = 'https://dummyimage.com/150';

// // Distance calculation
// function calculateDistance(userLoc, sellerLoc) {
//   if (
//     !userLoc?.lat ||
//     !userLoc?.lon ||
//     !sellerLoc?.latitude ||
//     !sellerLoc?.longitude ||
//     sellerLoc.latitude === 0 ||
//     sellerLoc.longitude === 0
//   ) {
//     console.warn('Invalid location data:', { userLoc, sellerLoc });
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
// }

// // Check network connectivity
// const checkNetworkStatus = () => {
//   if (!navigator.onLine) {
//     toast.error('No internet connection. Please check your network and try again.', {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#ff4d4f',
//         color: '#fff',
//         fontWeight: 'bold',
//         borderRadius: '8px',
//         padding: '16px',
//         boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//       },
//     });
//     return false;
//   }
//   return true;
// };

// function Products() {
//   const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
//   const [searchParams] = useSearchParams();
//   const location = useLocation();
//   const categoryId = searchParams.get('category');
//   const [products, setProducts] = useState([]);
//   const [categoryName, setCategoryName] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   const fetchCategoryName = useCallback(async () => {
//     if (!categoryId) {
//       toast.error('Please select a category to view products.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setError('Please select a category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return;
//     }
//     try {
//       const { data, error } = await supabase
//         .from('categories')
//         .select('name, max_delivery_radius_km, is_restricted')
//         .eq('id', parseInt(categoryId, 10))
//         .single();
//       if (error) throw error;
//       console.log('Category data:', data);
//       if (data?.is_restricted && !location.state?.fromCategories) {
//         toast.error(`Please select the ${data.name} category from the categories page to view products.`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         setError(`Please select the ${data.name} category to view products.`);
//         setProducts([]);
//         setLoading(false);
//         navigate('/categories');
//         return;
//       }
//       setCategoryName(data?.name || '');
//     } catch (err) {
//       console.error('Error fetching category name:', err);
//       toast.error('Failed to fetch category details.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setError('Failed to fetch category details.');
//     }
//   }, [categoryId, navigate, location.state]);

//   const fetchProducts = useCallback(async () => {
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       toast.error('No buyer location available. Please allow location access.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setProducts([]);
//       setLoading(false);
//       return;
//     }
//     if (!categoryId) {
//       toast.error('Please select a category to view products.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setError('Please select a category to view products.');
//       setProducts([]);
//       setLoading(false);
//       navigate('/categories');
//       return;
//     }
//     if (!checkNetworkStatus()) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       const { data: sellersData, error: sellersError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .not('latitude', 'is', null)
//         .not('longitude', 'is', null);
//       if (sellersError) throw sellersError;

//       const { data: productsData, error: productsError } = await supabase
//         .from('products')
//         .select(`
//           id,
//           title,
//           price,
//           original_price,
//           discount_amount,
//           images,
//           seller_id,
//           stock,
//           delivery_radius_km,
//           category_id,
//           categories (max_delivery_radius_km, is_restricted)
//         `)
//         .eq('category_id', parseInt(categoryId, 10))
//         .eq('is_approved', true)
//         .eq('status', 'active');
//       if (productsError) throw productsError;

//       console.log('Raw productsData for category', categoryId, ':', productsData);

//       const productIds = productsData.map((product) => product.id);

//       const { data: variantData, error: variantError } = await supabase
//         .from('product_variants')
//         .select('id, product_id, price, original_price, stock, attributes, images')
//         .eq('status', 'active')
//         .in('product_id', productIds);
//       if (variantError) throw variantError;

//       const nearbyProducts = productsData
//         .filter((product) => {
//           if (!product.categories) {
//             console.warn(`Product ${product.id} has no associated category`);
//             return false;
//           }
//           const seller = sellersData.find((s) => s.id === product.seller_id);
//           if (!seller) {
//             console.warn(`No seller found for product ${product.id}`);
//             return false;
//           }
//           const distance = calculateDistance(buyerLocation, {
//             latitude: seller.latitude,
//             longitude: seller.longitude,
//           });
//           const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
//           return distance !== null && distance <= effectiveRadius;
//         })
//         .map((product) => {
//           const variants = variantData
//             .filter((v) => v.product_id === product.id)
//             .map((v) => ({
//               id: v.id,
//               price: parseFloat(v.price) || 0,
//               originalPrice: v.original_price ? parseFloat(v.original_price) : null,
//               stock: v.stock || 0,
//               attributes: v.attributes || {},
//               images: v.images && v.images.length > 0 ? v.images : product.images,
//             }));

//           const validImages = Array.isArray(product.images)
//             ? product.images.filter((img) => typeof img === 'string' && img.trim())
//             : [];

//           return {
//             id: product.id,
//             name: product.title || 'Unnamed Product',
//             images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
//             price: parseFloat(product.price) || 0,
//             originalPrice: product.original_price ? parseFloat(product.original_price) : null,
//             discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
//             stock: product.stock || 0,
//             seller_id: product.seller_id,
//             deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
//             categoryId: product.category_id,
//             variants,
//             displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
//             displayOriginalPrice:
//               variants.length > 0
//                 ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
//                   product.original_price
//                 : product.original_price,
//           };
//         });

//       if (nearbyProducts.length === 0) {
//         toast(`No ${categoryName || 'products'} found within delivery radius for this category.`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#1890ff',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//       }

//       setProducts(nearbyProducts);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching products:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while fetching products. Please check your connection.'
//         : `Failed to fetch products: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setProducts([]);
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [buyerLocation, categoryId, categoryName, navigate]);

//   const validateVariant = async (variantId) => {
//     if (!variantId) return true;
//     const { data, error } = await supabase
//       .from('product_variants')
//       .select('id')
//       .eq('id', variantId)
//       .eq('status', 'active')
//       .single();
//     if (error || !data) {
//       console.error('Variant validation failed:', error);
//       return false;
//     }
//     return true;
//   };

//   const addToCart = async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to add items to cart.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('is_restricted')
//         .eq('id', product.categoryId)
//         .single();
//       if (categoryError) throw categoryError;
//       if (categoryData?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page to add products to cart.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/categories');
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id, delivery_radius_km, category_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData) {
//         toast.error('Seller information not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, sellerData);
//       if (distance === null) {
//         toast.error('Unable to calculate distance to seller.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       let effectiveRadius = productData.delivery_radius_km;
//       if (!effectiveRadius) {
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('max_delivery_radius_km')
//           .eq('id', productData.category_id)
//           .single();
//         if (categoryError) throw categoryError;
//         effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//       }

//       if (distance > effectiveRadius) {
//         toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//       }

//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       if (variantId === null) {
//         query = query.is('variant_id', null);
//       } else {
//         query = query.eq('variant_id', variantId);
//       }

//       const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         console.error('Fetch cart item error:', fetchError);
//         throw new Error(fetchError.message || 'Failed to check cart');
//       }

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         const stockLimit = itemToAdd.stock || product.stock;
//         if (newQuantity > stockLimit) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) {
//           console.error('Update cart error:', updateError);
//           throw new Error(updateError.message || 'Failed to update cart');
//         }
//         toast.success(`${product.name} quantity updated in cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//       } else {
//         const { data, error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           })
//           .select('id')
//           .single();
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//         setCartCount((prev) => prev + 1);
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         storedCart.push({
//           id: product.id,
//           cartId: data.id,
//           quantity: 1,
//           variantId,
//           price: itemToAdd.price || product.displayPrice,
//           title: product.name,
//           images: product.images,
//           uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//         });
//         localStorage.setItem('cart', JSON.stringify(storedCart));
//         toast.success(`${product.name} added to cart!`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#52c41a',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//       }
//     } catch (err) {
//       console.error('Error adding to cart:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while adding to cart. Please check your connection.'
//         : `Failed to add to cart: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//     }
//   };

//   const handleBuyNow = async (product) => {
//     if (!product || !product.id || !product.name || product.displayPrice === undefined) {
//       toast.error('Invalid product.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
//       toast.error('Out of stock.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       return;
//     }
//     if (!session?.user) {
//       toast.error('Please log in to proceed to checkout.', {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       navigate('/auth');
//       return;
//     }
//     if (!checkNetworkStatus()) return;

//     try {
//       const { data: categoryData, error: categoryError } = await supabase
//         .from('categories')
//         .select('is_restricted')
//         .eq('id', product.categoryId)
//         .single();
//       if (categoryError) throw categoryError;
//       if (categoryData?.is_restricted && !location.state?.fromCategories) {
//         toast.error('Please select this category from the categories page to proceed to checkout.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         navigate('/categories');
//         return;
//       }

//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select('id, seller_id, delivery_radius_km, category_id')
//         .eq('id', product.id)
//         .eq('is_approved', true)
//         .eq('status', 'active')
//         .single();
//       if (productError || !productData) {
//         toast.error('Product is not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       const { data: sellerData, error: sellerError } = await supabase
//         .from('sellers')
//         .select('id, latitude, longitude')
//         .eq('id', productData.seller_id)
//         .single();
//       if (sellerError || !sellerData) {
//         toast.error('Seller information not available.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       const distance = calculateDistance(buyerLocation, sellerData);
//       if (distance === null) {
//         toast.error('Unable to calculate distance to seller.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       let effectiveRadius = productData.delivery_radius_km;
//       if (!effectiveRadius) {
//         const { data: categoryData, error: categoryError } = await supabase
//           .from('categories')
//           .select('max_delivery_radius_km')
//           .eq('id', productData.category_id)
//           .single();
//         if (categoryError) throw categoryError;
//         effectiveRadius = categoryData?.max_delivery_radius_km || 40;
//       }

//       if (distance > effectiveRadius) {
//         toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         return;
//       }

//       let itemToAdd = product;
//       let variantId = null;

//       if (product.variants.length > 0) {
//         const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
//         if (validVariants.length === 0) {
//           toast.error('No available variants in stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//         itemToAdd = validVariants.reduce((cheapest, variant) =>
//           variant.price < cheapest.price ? variant : cheapest
//         );
//         variantId = itemToAdd.id;

//         const isValidVariant = await validateVariant(variantId);
//         if (!isValidVariant) {
//           toast.error('Selected variant is not available.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//       }

//       let query = supabase
//         .from('cart')
//         .select('id, quantity, variant_id')
//         .eq('user_id', session.user.id)
//         .eq('product_id', product.id);

//       if (variantId === null) {
//         query = query.is('variant_id', null);
//       } else {
//         query = query.eq('variant_id', variantId);
//       }

//       const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

//       if (fetchError && fetchError.code !== 'PGRST116') {
//         console.error('Fetch cart item error:', fetchError);
//         throw new Error(fetchError.message || 'Failed to check cart');
//       }

//       if (existingCartItem) {
//         const newQuantity = existingCartItem.quantity + 1;
//         const stockLimit = itemToAdd.stock || product.stock;
//         if (newQuantity > stockLimit) {
//           toast.error('Exceeds stock.', {
//             duration: 4000,
//             position: 'top-center',
//             style: {
//               background: '#ff4d4f',
//               color: '#fff',
//               fontWeight: 'bold',
//               borderRadius: '8px',
//               padding: '16px',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//             },
//           });
//           return;
//         }
//         const { error: updateError } = await supabase
//           .from('cart')
//           .update({ quantity: newQuantity })
//           .eq('id', existingCartItem.id);
//         if (updateError) {
//           console.error('Update cart error:', updateError);
//           throw new Error(updateError.message || 'Failed to update cart');
//         }
//       } else {
//         const { data, error: insertError } = await supabase
//           .from('cart')
//           .insert({
//             user_id: session.user.id,
//             product_id: product.id,
//             variant_id: variantId,
//             quantity: 1,
//             price: itemToAdd.price || product.displayPrice,
//             title: product.name,
//           })
//           .select('id')
//           .single();
//         if (insertError) {
//           console.error('Insert cart error:', insertError);
//           throw new Error(insertError.message || 'Failed to add to cart');
//         }
//         setCartCount((prev) => prev + 1);
//         const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
//         storedCart.push({
//           id: product.id,
//           cartId: data.id,
//           quantity: 1,
//           variantId,
//           price: itemToAdd.price || product.displayPrice,
//           title: product.name,
//           images: product.images,
//           uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
//         });
//         localStorage.setItem('cart', JSON.stringify(storedCart));
//       }

//       toast.success('Added to cart! Redirecting to cart...', {
//         duration: 2000,
//         position: 'top-center',
//         style: {
//           background: '#52c41a',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//       setTimeout(() => navigate('/cart'), 2000);
//     } catch (err) {
//       console.error('Error in Buy Now:', err);
//       const errorMessage = err.message.includes('Network')
//         ? 'Network error while adding to cart. Please check your connection.'
//         : `Failed to add to cart: ${err.message || 'Unknown error'}`;
//       toast.error(errorMessage, {
//         duration: 4000,
//         position: 'top-center',
//         style: {
//           background: '#ff4d4f',
//           color: '#fff',
//           fontWeight: 'bold',
//           borderRadius: '8px',
//           padding: '16px',
//           boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//         },
//       });
//     }
//   };

//   useEffect(() => {
//     fetchCategoryName();
//     if (!buyerLocation?.lat || !buyerLocation?.lon) {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const newLocation = {
//               lat: position.coords.latitude,
//               lon: position.coords.longitude,
//             };
//             setBuyerLocation(newLocation);
//             fetchProducts();
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             let errorMessage = 'Unable to fetch your location.';
//             if (error.code === error.PERMISSION_DENIED) {
//               errorMessage = 'Location access denied. Please enable location services.';
//             } else if (error.code === error.POSITION_UNAVAILABLE) {
//               errorMessage = 'Location information is unavailable. Please try again.';
//             } else if (error.code === error.TIMEOUT) {
//               errorMessage = 'Location request timed out. Please try again.';
//             }
//             toast.error(errorMessage, {
//               duration: 4000,
//               position: 'top-center',
//               style: {
//                 background: '#ff4d4f',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 borderRadius: '8px',
//                 padding: '16px',
//                 boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//               },
//             });
//             const defaultLoc = { lat: 12.9716, lon: 77.5946 }; // Bangalore default
//             setBuyerLocation(defaultLoc);
//             fetchProducts();
//           },
//           { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//         );
//       } else {
//         toast.error('Geolocation is not supported by this browser.', {
//           duration: 4000,
//           position: 'top-center',
//           style: {
//             background: '#ff4d4f',
//             color: '#fff',
//             fontWeight: 'bold',
//             borderRadius: '8px',
//             padding: '16px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
//           },
//         });
//         const defaultLoc = { lat: 12.9716, lon: 77.5946 }; // Bangalore default
//         setBuyerLocation(defaultLoc);
//         fetchProducts();
//       }
//     } else {
//       fetchProducts();
//     }
//   }, [fetchCategoryName, fetchProducts, buyerLocation, setBuyerLocation]);

//   const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
//   const pageDescription = categoryName
//     ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.`
//     : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.';
//   const pageUrl = categoryId
//     ? `https://www.markeet.com/products?category=${categoryId}`
//     : 'https://www.markeet.com/products';
//   const productList = products.map((product, index) => ({
//     '@type': 'ListItem',
//     position: index + 1,
//     name: product.name,
//     item: `https://www.markeet.com/product/${product.id}`,
//   }));

//   if (loading) {
//     return (
//       <div className="prod-loading">
//         <svg className="prod-spinner" viewBox="0 0 50 50">
//           <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
//         </svg>
//         Loading Products...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="prod-error">
//         {error}
//         <div className="prod-error-actions">
//           <button onClick={() => navigate('/categories')} className="prod-retry-btn">
//             Select a Category
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
//       <Helmet>
//         <title>{pageTitle}</title>
//         <meta name="description" content={pageDescription} />
//         <meta
//           name="keywords"
//           content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, groceries, gift, home decoration, Markeet, ecommerce`}
//         />
//         <meta name="robots" content="index, follow" />
//         <link rel="canonical" href={pageUrl} />
//         <meta property="og:title" content={pageTitle} />
//         <meta property="og:description" content={pageDescription} />
//         <meta property="og:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <meta property="og:url" content={pageUrl} />
//         <meta property="og:type" content="website" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content={pageTitle} />
//         <meta name="twitter:description" content={pageDescription} />
//         <meta name="twitter:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             '@context': 'https://schema.org',
//             '@type': 'ItemList',
//             itemListElement: productList,
//           })}
//         </script>
//       </Helmet>
//       {products.length === 0 ? (
//         <div className="prod-no-items">No products found within delivery radius for this category.</div>
//       ) : (
//         <>
//           <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
//           <div className="prod-grid">
//             {products.map((product) => (
//               <div
//                 key={product.id}
//                 className="prod-item"
//                 onClick={() => navigate(`/product/${product.id}`)}
//                 role="button"
//                 tabIndex={0}
//                 onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
//                 aria-label={`View product ${product.name}`}
//               >
//                 <div className="prod-image-wrapper">
//                   {product.discountAmount > 0 && (
//                     <span className="offer-badge">
//                       <span className="offer-label">Offer!</span>
//                       Save ₹{product.discountAmount.toFixed(2)}
//                     </span>
//                   )}
//                   <img
//                     src={product.images[0]}
//                     alt={product.name}
//                     onError={(e) => {
//                       console.warn(`Image failed to load for product ${product.id}: ${product.images[0]}`);
//                       e.target.src = DEFAULT_IMAGE;
//                     }}
//                     loading="lazy"
//                   />
//                 </div>
//                 <h3 className="prod-item-name">{product.name}</h3>
//                 <div className="prod-price-section">
//                   <p className="prod-price">
//                     ₹{product.displayPrice.toLocaleString('en-IN', {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </p>
//                   {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
//                     <p className="prod-original-price">
//                       ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </p>
//                   )}
//                 </div>
//                 <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
//                 <div className="prod-item-actions">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       addToCart(product);
//                     }}
//                     className="prod-add-cart-btn"
//                     disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                     aria-label={`Add ${product.name} to cart`}
//                   >
//                     {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
//                       ? 'Out of Stock'
//                       : 'Add to Cart'}
//                   </button>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBuyNow(product);
//                     }}
//                     className="prod-buy-now-btn"
//                     disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
//                     aria-label={`Buy ${product.name} now`}
//                   >
//                     Buy Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//       <Footer />
//     </div>
//   );
// }

// export default React.memo(Products);



import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LocationContext } from '../App';
import { toast } from 'react-hot-toast';
import '../style/Products.css';
import Footer from './Footer';
import { Helmet } from 'react-helmet-async';
import icon from '../assets/icon.png';

// Default placeholder image
const DEFAULT_IMAGE = 'https://dummyimage.com/150';

// Distance calculation
function calculateDistance(userLoc, sellerLoc) {
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
}

// Check network connectivity
const checkNetworkStatus = () => {
  if (!navigator.onLine) {
    toast.error('No internet connection. Please check your network and try again.', {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#ff4d4f',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
    });
    return false;
  }
  return true;
};

function Products() {
  const { buyerLocation, setBuyerLocation, session, setCartCount } = useContext(LocationContext);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const categoryId = searchParams.get('category');
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCategoryName = useCallback(async () => {
    if (!categoryId) {
      toast.error('Please select a category to view products.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setError('Please select a category to view products.');
      setProducts([]);
      setLoading(false);
      navigate('/categories');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, max_delivery_radius_km, is_restricted')
        .eq('id', parseInt(categoryId, 10))
        .single();
      if (error) throw error;
      if (data?.is_restricted && !location.state?.fromCategories) {
        toast.error(`Please select the ${data.name} category from the categories page to view products.`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        setError(`Please select the ${data.name} category to view products.`);
        setProducts([]);
        setLoading(false);
        navigate('/categories');
        return;
      }
      setCategoryName(data?.name || '');
    } catch (err) {
      toast.error('Failed to fetch category details.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setError('Failed to fetch category details.');
    }
  }, [categoryId, navigate, location.state]);

  const fetchProducts = useCallback(async () => {
    if (!buyerLocation?.lat || !buyerLocation?.lon) {
      toast.error('No buyer location available. Please allow location access.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setProducts([]);
      setLoading(false);
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category to view products.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setError('Please select a category to view products.');
      setProducts([]);
      setLoading(false);
      navigate('/categories');
      return;
    }
    if (!checkNetworkStatus()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (sellersError) throw sellersError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          original_price,
          discount_amount,
          images,
          seller_id,
          stock,
          delivery_radius_km,
          category_id,
          categories (max_delivery_radius_km, is_restricted)
        `)
        .eq('category_id', parseInt(categoryId, 10))
        .eq('is_approved', true)
        .eq('status', 'active');
      if (productsError) throw productsError;

      const productIds = productsData.map((product) => product.id);

      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price, original_price, stock, attributes, images')
        .eq('status', 'active')
        .in('product_id', productIds);
      if (variantError) throw variantError;

      const nearbyProducts = productsData
        .filter((product) => {
          if (!product.categories) {
            return false;
          }
          const seller = sellersData.find((s) => s.id === product.seller_id);
          if (!seller) {
            return false;
          }
          const distance = calculateDistance(buyerLocation, {
            latitude: seller.latitude,
            longitude: seller.longitude,
          });
          const effectiveRadius = product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40;
          return distance !== null && distance <= effectiveRadius;
        })
        .map((product) => {
          const variants = variantData
            .filter((v) => v.product_id === product.id)
            .map((v) => ({
              id: v.id,
              price: parseFloat(v.price) || 0,
              originalPrice: v.original_price ? parseFloat(v.original_price) : null,
              stock: v.stock || 0,
              attributes: v.attributes || {},
              images: v.images && v.images.length > 0 ? v.images : product.images,
            }));

          const validImages = Array.isArray(product.images)
            ? product.images.filter((img) => typeof img === 'string' && img.trim())
            : [];

          return {
            id: product.id,
            name: product.title || 'Unnamed Product',
            images: validImages.length > 0 ? validImages : [DEFAULT_IMAGE],
            price: parseFloat(product.price) || 0,
            originalPrice: product.original_price ? parseFloat(product.original_price) : null,
            discountAmount: product.discount_amount ? parseFloat(product.discount_amount) : 0,
            stock: product.stock || 0,
            seller_id: product.seller_id,
            deliveryRadius: product.delivery_radius_km || product.categories?.max_delivery_radius_km || 40,
            categoryId: product.category_id,
            variants,
            displayPrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : parseFloat(product.price),
            displayOriginalPrice:
              variants.length > 0
                ? variants.find((v) => v.price === Math.min(...variants.map((v) => v.price)))?.originalPrice ||
                  product.original_price
                : product.original_price,
          };
        });

      if (nearbyProducts.length === 0) {
        toast(`No ${categoryName || 'products'} found within delivery radius for this category.`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#1890ff',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
      }

      setProducts(nearbyProducts);
      setError(null);
    } catch (err) {
      const errorMessage = err.message.includes('Network')
        ? 'Network error while fetching products. Please check your connection.'
        : `Failed to fetch products: ${err.message || 'Unknown error'}`;
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setProducts([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [buyerLocation, categoryId, categoryName, navigate]);

  const validateVariant = async (variantId) => {
    if (!variantId) return true;
    const { data, error } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('status', 'active')
      .single();
    if (error || !data) {
      return false;
    }
    return true;
  };

  const addToCart = async (product) => {
    if (!product || !product.id || !product.name || product.displayPrice === undefined) {
      toast.error('Invalid product.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      return;
    }
    if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
      toast.error('Out of stock.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      return;
    }
    if (!session?.user) {
      toast.error('Please log in to add items to cart.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('is_restricted')
        .eq('id', product.categoryId)
        .single();
      if (categoryError) throw categoryError;
      if (categoryData?.is_restricted && !location.state?.fromCategories) {
        toast.error('Please select this category from the categories page to add products to cart.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        navigate('/categories');
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, seller_id, delivery_radius_km, category_id')
        .eq('id', product.id)
        .eq('is_approved', true)
        .eq('status', 'active')
        .single();
      if (productError || !productData) {
        toast.error('Product is not available.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .eq('id', productData.seller_id)
        .single();
      if (sellerError || !sellerData) {
        toast.error('Seller information not available.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      const distance = calculateDistance(buyerLocation, sellerData);
      if (distance === null) {
        toast.error('Unable to calculate distance to seller.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      let effectiveRadius = productData.delivery_radius_km;
      if (!effectiveRadius) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('max_delivery_radius_km')
          .eq('id', productData.category_id)
          .single();
        if (categoryError) throw categoryError;
        effectiveRadius = categoryData?.max_delivery_radius_km || 40;
      }

      if (distance > effectiveRadius) {
        toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      let itemToAdd = product;
      let variantId = null;

      if (product.variants.length > 0) {
        const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
        if (validVariants.length === 0) {
          toast.error('No available variants in stock.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
        itemToAdd = validVariants.reduce((cheapest, variant) =>
          variant.price < cheapest.price ? variant : cheapest
        );
        variantId = itemToAdd.id;

        const isValidVariant = await validateVariant(variantId);
        if (!isValidVariant) {
          toast.error('Selected variant is not available.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
      }

      let query = supabase
        .from('cart')
        .select('id, quantity, variant_id')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id);

      if (variantId === null) {
        query = query.is('variant_id', null);
      } else {
        query = query.eq('variant_id', variantId);
      }

      const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message || 'Failed to check cart');
      }

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1;
        const stockLimit = itemToAdd.stock || product.stock;
        if (newQuantity > stockLimit) {
          toast.error('Exceeds stock.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) {
          throw new Error(updateError.message || 'Failed to update cart');
        }
        toast.success(`${product.name} quantity updated in cart!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#52c41a',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
      } else {
        const { data, error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            variant_id: variantId,
            quantity: 1,
            price: itemToAdd.price || product.displayPrice,
            title: product.name,
          })
          .select('id')
          .single();
        if (insertError) {
          throw new Error(insertError.message || 'Failed to add to cart');
        }
        setCartCount((prev) => prev + 1);
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        storedCart.push({
          id: product.id,
          cartId: data.id,
          quantity: 1,
          variantId,
          price: itemToAdd.price || product.displayPrice,
          title: product.name,
          images: product.images,
          uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
        });
        localStorage.setItem('cart', JSON.stringify(storedCart));
        toast.success(`${product.name} added to cart!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#52c41a',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
      }
    } catch (err) {
      const errorMessage = err.message.includes('Network')
        ? 'Network error while adding to cart. Please check your connection.'
        : `Failed to add to cart: ${err.message || 'Unknown error'}`;
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
    }
  };

  const handleBuyNow = async (product) => {
    if (!product || !product.id || !product.name || product.displayPrice === undefined) {
      toast.error('Invalid product.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      return;
    }
    if (product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))) {
      toast.error('Out of stock.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      return;
    }
    if (!session?.user) {
      toast.error('Please log in to proceed to checkout.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      navigate('/auth');
      return;
    }
    if (!checkNetworkStatus()) return;

    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('is_restricted')
        .eq('id', product.categoryId)
        .single();
      if (categoryError) throw categoryError;
      if (categoryData?.is_restricted && !location.state?.fromCategories) {
        toast.error('Please select this category from the categories page to proceed to checkout.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        navigate('/categories');
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, seller_id, delivery_radius_km, category_id')
        .eq('id', product.id)
        .eq('is_approved', true)
        .eq('status', 'active')
        .single();
      if (productError || !productData) {
        toast.error('Product is not available.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, latitude, longitude')
        .eq('id', productData.seller_id)
        .single();
      if (sellerError || !sellerData) {
        toast.error('Seller information not available.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      const distance = calculateDistance(buyerLocation, sellerData);
      if (distance === null) {
        toast.error('Unable to calculate distance to seller.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      let effectiveRadius = productData.delivery_radius_km;
      if (!effectiveRadius) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('max_delivery_radius_km')
          .eq('id', productData.category_id)
          .single();
        if (categoryError) throw categoryError;
        effectiveRadius = categoryData?.max_delivery_radius_km || 40;
      }

      if (distance > effectiveRadius) {
        toast.error(`Product is not available in your area (${distance.toFixed(2)}km > ${effectiveRadius}km).`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        return;
      }

      let itemToAdd = product;
      let variantId = null;

      if (product.variants.length > 0) {
        const validVariants = product.variants.filter((v) => v.stock > 0 && v.price !== null);
        if (validVariants.length === 0) {
          toast.error('No available variants in stock.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
        itemToAdd = validVariants.reduce((cheapest, variant) =>
          variant.price < cheapest.price ? variant : cheapest
        );
        variantId = itemToAdd.id;

        const isValidVariant = await validateVariant(variantId);
        if (!isValidVariant) {
          toast.error('Selected variant is not available.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
      }

      let query = supabase
        .from('cart')
        .select('id, quantity, variant_id')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id);

      if (variantId === null) {
        query = query.is('variant_id', null);
      } else {
        query = query.eq('variant_id', variantId);
      }

      const { data: existingCartItem, error: fetchError } = await query.maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message || 'Failed to check cart');
      }

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + 1;
        const stockLimit = itemToAdd.stock || product.stock;
        if (newQuantity > stockLimit) {
          toast.error('Exceeds stock.', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ff4d4f',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          });
          return;
        }
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingCartItem.id);
        if (updateError) {
          throw new Error(updateError.message || 'Failed to update cart');
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            variant_id: variantId,
            quantity: 1,
            price: itemToAdd.price || product.displayPrice,
            title: product.name,
          })
          .select('id')
          .single();
        if (insertError) {
          throw new Error(insertError.message || 'Failed to add to cart');
        }
        setCartCount((prev) => prev + 1);
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        storedCart.push({
          id: product.id,
          cartId: data.id,
          quantity: 1,
          variantId,
          price: itemToAdd.price || product.displayPrice,
          title: product.name,
          images: product.images,
          uniqueKey: `${product.id}-${variantId || 'no-variant'}`,
        });
        localStorage.setItem('cart', JSON.stringify(storedCart));
      }

      toast.success('Added to cart! Redirecting to cart...', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#52c41a',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
      setTimeout(() => navigate('/cart'), 2000);
    } catch (err) {
      const errorMessage = err.message.includes('Network')
        ? 'Network error while adding to cart. Please check your connection.'
        : `Failed to add to cart: ${err.message || 'Unknown error'}`;
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ff4d4f',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        },
      });
    }
  };

  useEffect(() => {
    fetchCategoryName();
    if (!buyerLocation?.lat || !buyerLocation?.lon) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            };
            setBuyerLocation(newLocation);
            fetchProducts();
          },
          (error) => {
            let errorMessage = 'Unable to fetch your location in Jharia, Dhanbad.';
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = 'Location access denied. Please enable location services for Jharia, Dhanbad.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = 'Location information is unavailable in Jharia, Dhanbad. Please try again.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out in Jharia, Dhanbad. Please try again.';
            }
            toast.error(errorMessage, {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#ff4d4f',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
            });
            const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
            setBuyerLocation(defaultLoc);
            fetchProducts();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast.error('Geolocation is not supported by this browser.', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#ff4d4f',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        });
        const defaultLoc = { lat: 23.7407, lon: 86.4146 }; // Jharia, Dhanbad default
        setBuyerLocation(defaultLoc);
        fetchProducts();
      }
    } else {
      fetchProducts();
    }
  }, [fetchCategoryName, fetchProducts, buyerLocation, setBuyerLocation]);

  const pageTitle = categoryName ? `${categoryName} Products - Markeet` : 'Products - Markeet';
  const pageDescription = categoryName
    ? `Shop ${categoryName.toLowerCase()} products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.`
    : 'Shop products on Markeet. Find electronics, appliances, fashion, jewellery, groceries, and more with fast local delivery.';
  const pageUrl = categoryId
    ? `https://www.markeet.com/products?category=${categoryId}`
    : 'https://www.markeet.com/products';
  const productList = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.name,
    item: `https://www.markeet.com/product/${product.id}`,
  }));

  if (loading) {
    return (
      <div className="prod-loading">
        <svg className="prod-spinner" viewBox="0 0 50 50">
          <circle className="prod-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
        </svg>
        Loading Products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="prod-error">
        {error}
        <div className="prod-error-actions">
          <button onClick={() => navigate('/categories')} className="prod-retry-btn">
            Select a Category
          </button>
          <button onClick={() => navigate('/')} className="prod-back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prod-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={`${categoryName ? categoryName.toLowerCase() : 'products'}, electronics, appliances, fashion, jewellery, groceries, gift, home decoration, Markeet, ecommerce`}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={products[0]?.images[0] || DEFAULT_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: productList,
          })}
        </script>
      </Helmet>
      {products.length === 0 ? (
        <>
          <div className="prod-no-items">No products found within delivery radius for this category.</div>
          <img
            src={icon}
            alt="Markeet Logo"
            className="prod-icon"
          />
        </>
      ) : (
        <>
          <h2 className="prod-title">{categoryName ? `${categoryName} Products` : 'Products in Category'}</h2>
          <div className="prod-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="prod-item"
                onClick={() => navigate(`/product/${product.id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/product/${product.id}`)}
                aria-label={`View product ${product.name}`}
              >
                <div className="prod-image-wrapper">
                  {product.discountAmount > 0 && (
                    <span className="offer-badge">
                      <span className="offer-label">Offer!</span>
                      Save ₹{product.discountAmount.toFixed(2)}
                    </span>
                  )}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = DEFAULT_IMAGE;
                    }}
                    loading="lazy"
                  />
                </div>
                <h3 className="prod-item-name">{product.name}</h3>
                <div className="prod-price-section">
                  <p className="prod-price">
                    ₹{product.displayPrice.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {product.displayOriginalPrice && product.displayOriginalPrice > product.displayPrice && (
                    <p className="prod-original-price">
                      ₹{product.displayOriginalPrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
                <p className="prod-item-radius">Delivery Radius: {product.deliveryRadius} km</p>
                <div className="prod-item-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="prod-add-cart-btn"
                    disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(product);
                    }}
                    className="prod-buy-now-btn"
                    disabled={product.stock <= 0 || (product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))}
                    aria-label={`Buy ${product.name} now`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          <img
            src={icon}
            alt="Markeet Logo"
            className="prod-icon"
          />
        </>
      )}
      <Footer />
    </div>
  );
}

export default React.memo(Products);